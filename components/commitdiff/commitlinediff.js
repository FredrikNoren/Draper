var ko = require('knockout');
var components = require('ungit-components');
var inherits = require('util').inherits;
var fileType = require('../../source/utils/file-type.js');

var CommitLineDiff = function(args) {
  this.added = ko.observable(args.fileLineDiff[0]);
  this.removed = ko.observable(args.fileLineDiff[1]);
  this.fileName = ko.observable(args.fileLineDiff[2]);
  this.showSpecificDiff = ko.observable(false);
  this.path = args.repoPath;
  this.server = args.server;
  this.sha1 = args.sha1;
  this.specificDiff = ko.observable(components.create(this.type(), {
      filename: this.fileName(),
      repoPath: this.path,
      server: this.server,
      sha1: this.sha1,
      initialDisplayLineLimit: 50     //Image diff doesn't use this so it doesn't matter.
    }));
};
exports.CommitLineDiff = CommitLineDiff;

CommitLineDiff.prototype.fileNameClick = function(data, event) {
  if (this.showSpecificDiff()) {
    this.showSpecificDiff(false);
  } else {
    var self = this;
    this.specificDiff().invalidateDiff(function() {
      self.showSpecificDiff(true);
    });
  }
  event.stopImmediatePropagation();
};

CommitLineDiff.prototype.type = function() {
  if (!this.fileName()) {
    return 'textdiff';
  }
  return fileType(this.fileName()) + 'diff';
};

CommitLineDiff.prototype.checkoutFile = function(data, event) {
  this.server.post('/checkout/file', { path: this.path, sha1: this.sha1, fileName: this.fileName() });
  event.stopImmediatePropagation();
}
