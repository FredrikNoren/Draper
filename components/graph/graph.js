const ko = require('knockout');
const _ = require('lodash');
const octicons = require('octicons');
const components = require('ungit-components');
const GitNodeViewModel = require('./git-node');
const GitRefViewModel = require('./git-ref');
const EdgeViewModel = require('./edge');
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
    this.highestBranchOrder = 0;
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

  getRef(ref, constructIfUnavailable) {
    if (constructIfUnavailable === undefined) constructIfUnavailable = true;
    let refViewModel = this.refsByRefName[ref];
    if (!refViewModel && constructIfUnavailable) {
      refViewModel = this.refsByRefName[ref] = new GitRefViewModel(ref, this);
      this.refs.push(refViewModel);
      if (refViewModel.name === 'HEAD') {
        this.HEADref(refViewModel);
      }
    }
    return refViewModel;
  }

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
    const parent = this.nodesById.get(node.parents()[0]);
    if (parent) {
      this.traverseNodeLeftParents(parent, callback);
    }
  }

  computeNodes() {
    // TODO only re-run if selected branches or gotten nodes changed
    // TODO allow dangling tags as roots
    const nodes = [];
    const refs = this.refs()
      // Pick the refs to show
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
        if (a.node().date && b.node().date) return a.node().date - b.node().date;
        return a.refName < b.refName ? -1 : a.refName > b.refName ? 1 : 0;
      });

    const stamp = this._markIdeologicalStamp++;
    let branchSlot = 0;
    const walk = (node, ref, slot) => {
      if (node.stamp == stamp) return false;
      node.stamp = stamp;
      if (!node.isInited()) {
        this.missingNodes.add(node.sha1);
        return false;
      }
      if (slot > branchSlot) branchSlot = slot;
      nodes.push(node);
      node.ideologicalBranch(ref);
      node.branchOrder(slot);
      const parents = node.parents();
      for (let i = 0; i < parents.length; i++) {
        const parent = this.nodesById.get(parents[i]);
        walk(parent, ref, slot + i);
      }
      return true;
    };
    for (const ref of refs) {
      const node = ref.node();
      if (!node) {
        console.error('ref has no node, impossible', ref);
        continue;
      }
      const hasNode = walk(node, ref, branchSlot);
      if (hasNode) branchSlot++;
    }

    this.highestBranchOrder = branchSlot - 1;
    let prevNode;
    // Sort by descending date
    nodes.sort((a, b) => (a.isInited() && b.isInited() ? b.date - a.date : 0));
    for (const node of nodes) {
      node.aboveNode = prevNode;
      if (prevNode) prevNode.belowNode = node;
      prevNode = node;
    }
    if (prevNode) prevNode.belowNode = null;

    const edges = [];
    for (const node of nodes) {
      for (const parentSha1 of node.parents()) {
        edges.push(this.getEdge(node.sha1, parentSha1));
      }
      node.render();
    }

    this.edges(edges);
    this.nodes(nodes);

    if (nodes.length > 0) {
      this.graphHeight(nodes[nodes.length - 1].cy() + 80);
    }
    this.graphWidth(1000 + this.highestBranchOrder * 90);
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
        this.getRef(name).node(this.getNode(sha1Map[ref.name]));
        this.getRef(name).stamp = stamp;
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
