var expect = require('expect.js');
var request = require('supertest');
var express = require('express');
var fs = require('fs');
var path = require('path');
var restGit = require('../src/git-api');
var common = require('./common.js');

var app = express();
app.use(require('body-parser').json());

restGit.registerApi({ app: app, config: { dev: true, autoStashAndPop: true } });

var testDir;

var req = request(app);

describe('git-api conflict rebase', function () {

	this.timeout(8000);

	var commitMessage = 'Commit 1';
	var testFile1 = "testfile1.txt";
	var testBranch = 'testBranch';

	before(function(done) {
		common.createEmptyRepo(req).then(function(dir) {
			testDir = dir;

			return common.post(req, '/testing/createfile', { file: path.join(testDir, testFile1) })
        .then(function() { return common.post(req, '/commit', { path: testDir, message: commitMessage, files: [{ name: testFile1 }] }); })
        .then(function() { return common.post(req, '/branches', { path: testDir, name: testBranch, startPoint: 'master'}); })
        .then(function() { return common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1)}); })
        .then(function() { return common.post(req, '/commit', { path: testDir, message: commitMessage, files: [{ name: testFile1 }]}); })
				.then(function() { return common.post(req, '/checkout', { path: testDir, name: testBranch}); })
				.then(function() { return common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1)}); })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: commitMessage, files: [{ name: testFile1 }]}); })
		}).then(function() { done(); }).catch(done);
	});

	it('should be possible to rebase on master', function(done) {
		req
			.post(restGit.pathPrefix + '/rebase')
			.send({ path: testDir, onto: 'master' })
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(400)
			.then(function(res) {
				expect(res.body.errorCode).to.be('merge-failed');
			}).then(function() { done(); }).catch(done);
	});

	it('status should list files in conflict', function(done) {
		common.get(req, '/status', { path: testDir }).then(function(res) {
			expect(res.body.inRebase).to.be(true);
			expect(Object.keys(res.body.files).length).to.be(1);
			expect(res.body.files[testFile1]).to.eql({
				displayName: testFile1,
				isNew: false,
				staged: false,
				removed: false,
				conflict: true,
				renamed: false,
				type: 'text',
				additions: '4',
				deletions: '0'
			});
		}).then(function() { done(); }).catch(done);
	});

	it('should be possible fix the conflict', function(done) {
		common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) })
      .then(function() { done(); }).catch(done);
	});

	it('should be possible to resolve', function(done) {
		common.post(req, '/resolveconflicts', { path: testDir, files: [testFile1] })
      .then(function() { done(); }).catch(done);
	});

	it('should be possible continue the rebase', function(done) {
		common.post(req, '/rebase/continue', { path: testDir })
      .then(function() { done(); }).catch(done);
	});

})

describe('git-api conflict checkout', function () {

	this.timeout(8000);

	var testBranch = 'testBranch';
	var testFile1 = "testfile1.txt";

	before(function(done) {
		common.createEmptyRepo(req).then(function(dir) {
      testDir = dir;
			return common.post(req, '/testing/createfile', { file: path.join(testDir, testFile1) })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: 'a', files: [{ name: testFile1 }] }); })
				.then(function() { return common.post(req, '/branches', { path: testDir, name: testBranch, startPoint: 'master' }); })
				.then(function() { return common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) }); })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: 'b', files: [{ name: testFile1 }] }); })
		}).then(function() { done(); }).catch(done);
	});

	it('should be possible to make some changes', function(done) {
		common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) })
      .then(function() { done(); }).catch(done);
	});

	it('should be possible to checkout with local files that will conflict', function(done) {
		req
			.post(restGit.pathPrefix + '/checkout')
			.send({ path: testDir, name: testBranch })
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(400)
			.then(function(res) {
				expect(res.body.errorCode).to.be('merge-failed');
			}).then(function() { done(); }).catch(done);
	});

	it('status should list files in conflict', function(done) {
		common.get(req, '/status', { path: testDir }).then(function(res) {
			expect(res.body.inRebase).to.be(false);
			expect(Object.keys(res.body.files).length).to.be(1);
			expect(res.body.files[testFile1]).to.eql({
				displayName: testFile1,
				isNew: false,
				staged: false,
				removed: false,
				conflict: true,
				renamed: false,
				type: 'text',
				additions: '4',
				deletions: '0'
			});
		}).then(function() { done(); }).catch(done);
	});

});


describe('git-api conflict merge', function () {

	this.timeout(8000);

	var testBranch = 'testBranch1';
	var testFile1 = "testfile1.txt";

	before(function(done) {
		common.createEmptyRepo(req).then(function(dir) {
			testDir = dir;
      return common.post(req, '/testing/createfile', { file: path.join(testDir, testFile1) })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: 'a', files: [{ name: testFile1 }] }); })
				.then(function() { return common.post(req, '/branches', { path: testDir, name: testBranch, startPoint: 'master' }); })
				.then(function() { return common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) }); })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: 'b', files: [{ name: testFile1 }] }); })
				.then(function() { return common.post(req, '/checkout', { path: testDir, name: testBranch }); })
				.then(function() { return common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) }); })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: 'c', files: [{ name: testFile1 }] }); })
		}).then(function() { done(); }).catch(done);
	});

	it('should be possible to merge the branches', function(done) {
		req
			.post(restGit.pathPrefix + '/merge')
			.send({ path: testDir, with: 'master' })
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(400)
			.then(function(res) {
				expect(res.body.errorCode).to.be('merge-failed');
			}).then(function() { done(); }).catch(done);
	});

	it('status should list files in conflict', function(done) {
		common.get(req, '/status', { path: testDir }).then(function(res) {
			expect(res.body.inMerge).to.be(true);
			expect(res.body.commitMessage).to.be.ok();
			expect(Object.keys(res.body.files).length).to.be(1);
			expect(res.body.files[testFile1]).to.eql({
				displayName: testFile1,
				isNew: false,
				staged: false,
				removed: false,
				conflict: true,
				renamed: false,
				type: 'text',
				additions: '4',
				deletions: '0'
			});
		}).then(function() { done(); }).catch(done);
	});

	it('should be possible fix the conflict', function(done) {
		common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) })
      .then(function() { done(); }).catch(done);
	});

	it('should be possible to resolve', function(done) {
		common.post(req, '/resolveconflicts', { path: testDir, files: [testFile1] })
      .then(function() { done(); }).catch(done);
	});

	it('should be possible continue the merge', function(done) {
		common.post(req, '/merge/continue', { path: testDir, message: 'something' })
      .then(function() { done(); }).catch(done);
	});

});


describe('git-api conflict solve by deleting', function () {

	this.timeout(8000);

	var commitMessage = 'Commit 1';
	var testFile1 = "testfile1.txt";
	var testBranch = 'testBranch';

	before(function(done) {
		common.createEmptyRepo(req, function(dir) {
			testDir = dir;

      return common.post(req, '/testing/createfile', { file: path.join(testDir, testFile1) })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: commitMessage, files: [{ name: testFile1 }] }); })
				.then(function() { return common.post(req, '/branches', { path: testDir, name: testBranch, startPoint: 'master' }); })
				.then(function() { return common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) }); })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: commitMessage, files: [{ name: testFile1 }] }); })
				.then(function() { return common.post(req, '/checkout', { path: testDir, name: testBranch }); })
				.then(function() { return common.post(req, '/testing/changefile', { file: path.join(testDir, testFile1) }); })
				.then(function() { return common.post(req, '/commit', { path: testDir, message: commitMessage, files: [{ name: testFile1 }] }); })
		}).then(function() { done(); }).catch(done);
	});

	it('should be possible to rebase on master', function(done) {
		req
			.post(restGit.pathPrefix + '/rebase')
			.send({ path: testDir, onto: 'master' })
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(400)
			.then(function(res) {
				expect(res.body.errorCode).to.be('merge-failed');
			}).then(function() { done(); }).catch(done);
	});

	it('status should list files in conflict', function(done) {
		common.get(req, '/status', { path: testDir }).then(function(res) {
			expect(res.body.inRebase).to.be(true);
			expect(Object.keys(res.body.files).length).to.be(1);
			expect(res.body.files[testFile1]).to.eql({
				displayName: testFile1,
				isNew: false,
				staged: false,
				removed: false,
				conflict: true,
				renamed: false,
				type: 'text',
				additions: '4',
				deletions: '0'
			});
		}).then(function() { done(); }).catch(done);
	});

	it('should be possible to remove the file', function(done) {
		common.post(req, '/testing/removefile', { file: path.join(testDir, testFile1) })
      .then(function() { done(); }).catch(done);
	});

	it('should be possible to resolve', function(done) {
		common.post(req, '/resolveconflicts', { path: testDir, files: [testFile1] })
      .then(function() { done(); }).catch(done);
	});

	it('should be possible continue the rebase', function(done) {
		common.post(req, '/rebase/continue', { path: testDir })
      .then(function() { done(); }).catch(done);
	});

	after(function(done) {
		common.post(req, '/testing/cleanup', undefined)
      .then(function() { done(); }).catch(done);
	});

});
