const ko = require('knockout');
const _ = require('lodash');
const octicons = require('octicons');
const components = require('ungit-components');
const GitNodeViewModel = require('./git-node');
const GitRefViewModel = require('./git-ref');
const EdgeViewModel = require('./edge');
const SortedSet = require('js-sorted-set');
const numberOfNodesPerLoad = ungit.config.numberOfNodesPerLoad;

components.register('graph', (args) => new GraphViewModel(args.server, args.repoPath));

class GraphViewModel {
  constructor(server, repoPath) {
    this._markIdeologicalStamp = 0;
    this.repoPath = repoPath;
    this.limit = ko.observable(numberOfNodesPerLoad);
    this.skip = ko.observable(0);
    this.server = server;
    this.currentRemote = ko.observable();
    this.nodes = ko.observableArray(/** @type {GraphNode[]} */ ([]));
    this.missingNodes = new Set();
    this.logNodes = [];
    this.edges = ko.observableArray(/** @type {GraphEdge[]} */ ([]));
    this.refs = ko.observableArray(/** @type {GraphRef[]} */ ([]));
    this.nodesById = /** @type {Map<Hash, GraphNode>} */ (new Map());
    this.refsByRefName = /** @type {Record<string, GraphRef>} */ ({});
    this.checkedOutBranch = ko.observable();
    this.checkedOutRef = ko.computed(() =>
      this.checkedOutBranch() ? this.getRef(`refs/heads/${this.checkedOutBranch()}`) : null
    );
    this.HEADref = ko.observable();
    this.HEAD = ko.computed(() => (this.HEADref() ? this.HEADref().node() : undefined));
    this.commitNodeColor = ko.computed(() => (this.HEAD() ? this.HEAD().color() : '#4A4A4A'));
    this.commitNodeEdge = ko.computed(() => {
      if (!this.HEAD() || !this.HEAD().cx() || !this.HEAD().cy()) return;
      return `M 610 68 L ${this.HEAD().cx()} ${this.HEAD().cy()}`;
    });
    this.showCommitNode = ko.observable(false);
    this.currentActionContext = ko.observable();
    this.edgesById = {};
    this.scrolledToEnd = _.debounce(() => this.fetchCommits(), 500, true);
    this.loadAhead = _.debounce(() => this.fetchCommits(), 500, true);
    this.commitOpacity = ko.observable(1.0);
    this.hoverGraphActionGraphic = ko.observable();
    this.hoverGraphActionGraphic.subscribe(
      (value) => {
        if (value && value.destroy) value.destroy();
      },
      null,
      'beforeChange'
    );

    this.hoverGraphAction = ko.observable();
    this.hoverGraphAction.subscribe((value) => {
      if (value && value.createHoverGraphic) {
        this.hoverGraphActionGraphic(value.createHoverGraphic());
      } else {
        this.hoverGraphActionGraphic(null);
      }
    });

    this.loadNodesFromApiThrottled = _.throttle(this.fetchCommits.bind(this), 1000);
    this.updateBranchesThrottled = _.throttle(this.updateBranches.bind(this), 1000);
    this.updateBranches();
    this.graphWidth = ko.observable();
    this.graphHeight = ko.observable(800);
    this.searchIcon = octicons.search.toSVG({ height: 18 });
    this.plusIcon = octicons.plus.toSVG({ height: 18 });
    // For debugging, remove later
    console.log(this);
  }

  updateNode(parentElement) {
    ko.renderTemplate('graph', this, {}, parentElement);
  }

  getNode(sha1, logEntry) {
    let nodeViewModel = this.nodesById.get(sha1);
    if (!nodeViewModel) {
      nodeViewModel = new GitNodeViewModel(this, sha1);
      this.nodesById.set(sha1, nodeViewModel);
    }
    if (logEntry) nodeViewModel.setData(logEntry);
    return nodeViewModel;
  }

  getRef(ref, sha1) {
    let refViewModel = this.refsByRefName[ref];
    if (!refViewModel && sha1) {
      refViewModel = this.refsByRefName[ref] = new GitRefViewModel(ref, this, sha1);
      this.refs.push(refViewModel);
      if (refViewModel.name === 'HEAD') {
        this.HEADref(refViewModel);
      }
    }
    return refViewModel;
  }

  // TODO on startup, fetch HEAD only, then fetch missing on-screen nodes
  // when they scroll into view
  async fetchCommits() {
    this.missingNodes.clear();
    this.computeNodes();
    console.log('missing %d nodes', this.missingNodes.size);
    if (!this.missingNodes.size) return;
    const nodeSize = this.nodesById.size;
    try {
      const commits = await this.server.getPromise('/commits', {
        path: this.repoPath(),
        limit: this.limit(),
        ids: [...this.missingNodes.values()].join(),
      });
      for (const c of commits) {
        this.getNode(c.sha1, c);
        this.missingNodes.delete(c.sha1);
      }
      this.computeNodes();
    } catch (e) {
      this.server.unhandledRejection(e);
    } finally {
      if (window.innerHeight - this.graphHeight() > 0 && nodeSize != this.nodesById.size) {
        this.scrolledToEnd();
      }
    }
  }

  traverseNodeLeftParents(node, callback) {
    callback(node);
    const parent = node.parents()[0];
    if (parent) {
      this.traverseNodeLeftParents(parent, callback);
    }
  }

  /**
   * Concept: put branches + side branches on slots
   * - order the refs in some way
   * - fully walk their nodes, marking ideological branches and slots
   * - this leaves a couple branches
   * - put each branch on the graph in a slot where they are clear for their entire length
   */
  computeNodes() {
    // TODO only re-run if selected branches or gotten nodes changed
    const refs = this.refs()
      // Pick the refs to show
      // TODO allow dangling tags as roots
      .filter((r) => !r.isLocalTag && !r.isRemoteTag && !r.isStash)
      // Branch ordering
      .sort((a, b) => {
        if (a.isLocalHEAD) return -1;
        if (b.isLocalHEAD) return 1;
        if (a.isLocal && !b.isLocal) return -1;
        if (b.isLocal && !a.isLocal) return 1;
        if (a.isBranch && !b.isBranch) return -1;
        if (b.isBranch && !a.isBranch) return 1;
        if (a.isHEAD && !b.isHEAD) return 1;
        if (!a.isHEAD && b.isHEAD) return -1;
        if (a.node() === b.node()) return 0;
        if (a.node().date && b.node().date) return b.node().date - a.node().date;
        return 0;
      });
    if (!refs.length) return;
    let nodeCount = 0;
    const seen = new WeakSet();
    /** @type {{ node: GraphNode; slot: number; distance: number; ref: GraphRef }[]} */
    const toWalk = [];
    for (const ref of refs) {
      ref.maxHeight = 0;
      ref.onto = null;
      ref.leaf = null;
      toWalk.push({ node: ref.node(), slot: 0, distance: 0, ref });
    }
    while (toWalk.length) {
      // eslint-disable-next-line prefer-const
      let { node, slot, distance, ref } = toWalk.shift();
      if (seen.has(node)) continue;
      do {
        distance++;
        node.order = nodeCount++;
        node.slot(slot);
        node.ideologicalBranch(ref);
        seen.add(node);
        if (!node.isInited()) this.missingNodes.add(node.sha1);
        const parents = node.parents();
        const left = parents[0];
        for (let i = 0; i < parents.length; i++) {
          const p = parents[i];
          // Sort missing nodes immediately below last child
          if (!p.isInited() && (!p.date || p.date >= node.date)) p.date = node.date - 1;
          if (i) toWalk.unshift({ node: p, slot: slot + i + 1, distance, ref });
        }

        if (!left || seen.has(left)) {
          if ((!left || ref !== left.ideologicalBranch()) && ref.maxHeight < distance) {
            ref.maxHeight = distance;
            ref.onto = left && left.ideologicalBranch();
            ref.leaf = node;
          }
          break;
        }
        node = left;
        // eslint-disable-next-line no-constant-condition
      } while (true);
    }

    // Sort commits by descending date
    // Note: output 0 means nodes are the same and are stored only once
    const comparator = (/** @type {GraphNode} */ a, /** @type {GraphNode} */ b) => {
      if (a === b) return 0;
      if (a.sha1 === b.sha1) {
        console.log(a, b, 'are different but the same');
        return 0;
      }
      const refA = a.ideologicalBranch();
      const refB = b.ideologicalBranch();
      // Since we initialize order before inserting, this should never clash
      const orderDiff = a.order - b.order;
      // Make sure same-branch-slot commits are in walk order, ignoring date
      if (refA === refB && a.slot() === b.slot()) return orderDiff;
      // Otherwise order by descending date if known
      if (a.date && b.date) {
        const diff = b.date - a.date;
        // don't return 0
        if (diff) return diff;
      }
      return orderDiff;
    };
    const nodes = new SortedSet({ comparator });
    // We use a separate set because our sorting is dependent on slot
    // and that can cause .contains to give false negatives
    const sortedSeen = new WeakSet();
    // Now we take each branch and graft it onto the graph
    let maxSlot = 0;
    let lastRef;
    while (refs.length) {
      let ref;
      if (lastRef) {
        const idx = refs.findIndex((r) => r.onto === lastRef);
        if (idx >= 0) ref = refs.splice(idx, 1)[0];
      }
      if (!ref) ref = refs.shift();
      if (!ref.maxHeight) continue;
      const node = ref.node();
      // The branch is already in another branch
      if (nodes.contains(node)) continue;
      const until = ref.leaf;

      // Find the next free slot by walking the nodes next to ref
      // This will point to before the next largest node
      let it = nodes.findIterator(node);
      // Leave room for possible previous branch end by going one back
      if (it.hasPrevious()) it = it.previous();
      // Give HEAD some room
      let mySlot = ref.isLocalHEAD ? -1 : 1;
      let val;
      let i = 0;
      while (i < 100 && it.hasNext()) {
        i++;
        val = it.value();
        const slot = val.slot();
        if (slot > maxSlot) maxSlot = slot;
        if (slot > mySlot) mySlot = slot;
        if (comparator(until, val) > 0) break;
        it = it.next();
      }
      mySlot++;
      // Now insert the branch and move it to its slot
      const putBranch = (node) => {
        if (sortedSeen.has(node)) return;
        node.slot(node.slot() + mySlot);
        nodes.insert(node);
        sortedSeen.add(node);
        for (const next of node.parents()) putBranch(next);
      };
      putBranch(node);
      lastRef = ref;
    }

    // TODO probably better to keep sortedNodes and store the index
    /** @type {GraphNode} */
    let prevNode;
    /** @type {GraphNode[]} */
    const sortedNodes = nodes.map((f) => f);
    for (const node of sortedNodes) {
      node.aboveNode = prevNode;
      if (prevNode) prevNode.belowNode = node;
      prevNode = node;
    }
    if (prevNode) prevNode.belowNode = null;

    const edges = [];
    let maxY = 0;
    for (const node of sortedNodes) {
      for (const parent of node.parents()) {
        edges.push(this.getEdge(node.sha1, parent.sha1));
      }
      node.render();
      if (maxY < node.cy()) maxY = node.cy();
    }

    this.edges(edges);
    this.nodes(sortedNodes);

    if (sortedNodes.length > 0) {
      this.graphHeight(maxY + 80);
    }
    this.graphWidth(1000 + maxSlot * 90);
  }

  getEdge(nodeAsha1, nodeBsha1) {
    const id = `${nodeAsha1}-${nodeBsha1}`;
    let edge = this.edgesById[id];
    if (!edge) {
      edge = this.edgesById[id] = new EdgeViewModel(this, nodeAsha1, nodeBsha1);
    }
    return edge;
  }

  handleBubbledClick(elem, event) {
    // If the clicked element is bound to the current action context,
    // then let's not deselect it.
    if (ko.dataFor(event.target) === this.currentActionContext()) return;
    if (this.currentActionContext() && this.currentActionContext() instanceof GitNodeViewModel) {
      this.currentActionContext().toggleSelected();
    } else {
      this.currentActionContext(null);
    }
    // If the click was on an input element, then let's allow the default action to proceed.
    // This is especially needed since for some strange reason any submit (ie. enter in a textbox)
    // will trigger a click event on the submit input of the form, which will end up here,
    // and if we don't return true, then the submit event is never fired, breaking stuff.
    if (event.target.nodeName === 'INPUT') return true;
  }

  onProgramEvent(event) {
    if (event.event == 'git-directory-changed') {
      this.updateBranchesThrottled();
      // } else if (event.event == 'request-app-content-refresh') {
    } else if (event.event == 'remote-tags-update') {
      this.setRemoteTags(event.tags);
    } else if (event.event == 'current-remote-changed') {
      this.currentRemote(event.newRemote);
    } else if (event.event == 'graph-render') {
      this.nodes().forEach((node) => {
        node.render();
      });
    }
  }

  updateAnimationFrame(deltaT) {
    this.nodes().forEach((node) => {
      node.updateAnimationFrame(deltaT);
    });
  }

  updateBranches() {
    this.server
      .getPromise('/checkout', { path: this.repoPath() })
      .then((res) => {
        this.checkedOutBranch(res);
      })
      .catch((err) => {
        if (err.errorCode != 'not-a-repository') this.server.unhandledRejection(err);
      });
  }

  setRemoteTags(remoteTags) {
    const stamp = Date.now();

    const sha1Map = {}; // map holding true sha1 per tags
    remoteTags.forEach((tag) => {
      if (tag.name.includes('^{}')) {
        // This tag is a dereference tag, use this sha1.
        const tagRef = tag.name.slice(0, tag.name.length - '^{}'.length);
        sha1Map[tagRef] = tag.sha1;
      } else if (!sha1Map[tag.name]) {
        // If sha1 wasn't previously set, use this sha1
        sha1Map[tag.name] = tag.sha1;
      }
    });

    remoteTags.forEach((ref) => {
      if (!ref.name.includes('^{}')) {
        const name = `remote-tag: ${ref.remote}/${ref.name.split('/')[2]}`;
        const r = this.getRef(name, sha1Map[ref.name]);
        r.stamp = stamp;
      }
    });
    this.refs().forEach((ref) => {
      // tag is removed from another source
      if (ref.isRemoteTag && ref.stamp !== stamp) {
        ref.remove(true);
      }
    });
  }

  checkHeadMove(toNode) {
    if (this.HEAD() === toNode) {
      this.HEADref().node(toNode);
    }
  }
}

module.exports = GraphViewModel;
