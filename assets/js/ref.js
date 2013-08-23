

var RefViewModel = function(args) {
	var self = this;
	this.node = ko.observable();
	this.boxDisplayX = ko.computed(function() {
		if (!self.node()) return 0;
		return self.node().x();
	});
	this.boxDisplayY = ko.computed(function() {
		if (!self.node()) return 0;
		return self.node().y();
	});
	this.name = args.name;
	this.displayName = this.name;
	this.isLocalTag = this.name.indexOf('tag: refs/tags/') == 0;
	this.isRemoteTag = this.name.indexOf('remote-tag: refs/tags/') == 0;
	this.isTag = this.isLocalTag || this.isRemoteTag;
	this.isLocalHEAD = this.name == 'HEAD';
	this.isRemoteHEAD = this.name == 'refs/remotes/origin/HEAD';
	this.isLocalBranch = this.name.indexOf('refs/heads/') == 0;
	this.isRemoteBranch = this.name.indexOf('refs/remotes/origin/') == 0 && !this.isRemoteHEAD;
	this.isHEAD = this.isLocalHEAD || this.isRemoteHEAD;
	this.isBranch = this.isLocalBranch || this.isRemoteBranch;
	this.isRemote = this.isRemoteBranch || this.isRemoteTag;
	this.isLocal = this.isLocalBranch || this.isLocalTag;
	if (this.isLocalBranch) this.displayName = this.name.slice('refs/heads/'.length);
	if (this.isRemoteBranch) this.displayName = this.name.slice('refs/remotes/origin/'.length);
	if (this.isLocalTag) this.displayName = this.name.slice('tag: refs/tags/'.length);
	if (this.isRemoteTag) this.displayName = this.name.slice('remote-tag: refs/tags/'.length);
	this.show = true;
	this.graph = args.graph;
	this.remoteRef = ko.observable();
	this.localRef = ko.observable();
	this.current = ko.computed(function() {
		return self.isLocalBranch && self.graph.activeBranch() == self.displayName;
	});
	this.canBePushed = ko.computed(function() {
		if (!self.isLocal || !self.graph.hasRemotes()) return false;
		if (self.remoteRef()) return self.node() != self.remoteRef().node();
		else return true;
	});
	this.color = args.color;
	this.remoteIsAncestor = ko.computed(function() {
		if (!self.remoteRef()) return false;
		return self.node().isAncestor(self.remoteRef().node());
	});
	this.remoteIsOffspring = ko.computed(function() {
		if (!self.remoteRef()) return false;
		return self.remoteRef().node().isAncestor(self.node());
	});
}
if (typeof exports !== 'undefined') exports.RefViewModel = RefViewModel;
RefViewModel.prototype.dragStart = function() {
	this.graph.draggingRef(this);
}
RefViewModel.prototype.dragEnd = function() {
	this.graph.draggingRef(null);
}
