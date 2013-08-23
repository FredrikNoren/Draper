var config = require('./config')();
if (config.bugtracking) {
	var bugsense = require('./bugsense');
	bugsense.init('ungit-node');
}
var express = require('express');
var gitApi = require('./git-api');
var winston = require('winston');
var version = require('./version');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var semver = require('semver');
var path = require('path');
var fs = require('fs');

if (config.logDirectory)
	winston.add(winston.transports.File, { filename: path.join(config.logDirectory, 'server.log'), maxsize: 100*1024, maxFiles: 2 });

var users = config.users;
config.users = null; // So that we don't send the users to the client


	if (config.authentication) {

		passport.serializeUser(function(username, done) {
		  done(null, username);
		});

		passport.deserializeUser(function(username, done) {
			done(null, users[username]);
		});

		passport.use(new LocalStrategy(function(username, password, done) {
		  	var password = users[username];
		  	if (users[username] && password == users[username])
		  		done(null, username);
		  	else
		  		done(null, false, { message: 'No such username/password' });
			}
		));
	}

	var app = express();
	var server = require('http').createServer(app);

	gitApi.pathPrefix = '/api';

	app.use(function(req, res, next){
		winston.info(req.method + ' ' + req.url);
		next();
	});

	var noCache = function(req, res, next) {
		res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
		res.set('Pragma', 'no-cache');
		res.set('Expires', '0');
		next();
	}
	app.use(noCache);
	
	var ensureAuthenticated = function(req, res, next) { next(); };

	if (config.authentication) {
		app.use(express.cookieParser());
		app.use(express.bodyParser());
		app.use(express.session({ secret: 'ungit' }));
		app.use(passport.initialize());
		app.use(passport.session());

		app.post('/api/login', function(req, res, next) {
			passport.authenticate('local', function(err, user, info) {
				if (err) { return next(err) }
				if (!user) {
					res.json(401, { errorCode: 'authentication-failed', error: info.message });
					return;
				}
				req.logIn(user, function(err) {
					if (err) { return next(err); }
					res.json({ ok: true });
					return;
				});
			})(req, res, next);
		});

		app.get('/api/loggedin', function(req, res){
			if (req.isAuthenticated()) res.json({ loggedIn: true });
			else res.json({ loggedIn: false });
		});

		app.get('/api/logout', function(req, res){
			req.logout();
			res.json({ ok: true });
		});

		ensureAuthenticated = function(req, res, next) {
			if (req.isAuthenticated()) { return next(); }
			res.json(401, { errorCode: 'authentication-required', error: 'You have to authenticate to access this resource' });
		};
	}

	app.use(express.static(__dirname + '/../public'));
	gitApi.registerApi(app, server, ensureAuthenticated, config);

	app.get('/config.js', function(req, res) {
		res.send('ungit.config = ' + JSON.stringify(config));
	});

	app.get('/version.js', function(req, res) {
		version.getVersion(function(ver) {
			res.send('ungit.version = \'' + ver + '\'');
		});
	});

	app.get('/api/latestversion', function(req, res) {
		version.getVersion(function(currentVersion) {
			version.getLatestVersion(function(err, latestVersion) {
				if (err)
					res.json({ latestVersion: currentVersion, currentVersion: currentVersion, outdated: false });
				else if (!semver.valid(currentVersion))
					res.json({ latestVersion: latestVersion, currentVersion: currentVersion, outdated: false });
				else
					res.json({ latestVersion: latestVersion, currentVersion: currentVersion, outdated: semver.gt(latestVersion, currentVersion) });
			});
		});
	});

	app.get('/api/ping', function(req, res) {
		res.json({});
	});

	function getUserHome() {
		return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
	}
	var userConfigPath = path.join(getUserHome(), '.ungitrc');
	function readUserConfig(callback) {
		fs.exists(userConfigPath, function(hasConfig) {
			if (!hasConfig) return callback(null, {});

			fs.readFile(userConfigPath, function(err, content) {
				if (err) return callback(err);
				else callback(null, JSON.parse(content.toString()));
			});
		});
	}
	function writeUserConfig(configContent, callback) {
		fs.writeFile(userConfigPath, JSON.stringify(configContent, undefined, 2), callback);
	}

	app.post('/api/enablebugtracking', ensureAuthenticated, function(req, res) {
		readUserConfig(function(err, userConfig) {
			if (err) throw err;
			userConfig.bugtracking = true;
			writeUserConfig(userConfig, function(err) {
				if (err) throw err;
				res.json({});
			});
		});
	});

	app.post('/api/enablebugtrackingandstats', ensureAuthenticated, function(req, res) {
		readUserConfig(function(err, userConfig) {
			if (err) throw err;
			userConfig.bugtracking = true;
			userConfig.googleAnalytics = true;
			writeUserConfig(userConfig, function(err) {
				if (err) throw err;
				res.json({});
			});
		});
	});

	// Error handling
	app.use(function(err, req, res, next) {
		if (config.bugtracking)
			bugsense.notify(err, 'ungit-node');
		winston.error(err.stack);
		res.send(500, { error: err.message, errorType: err.name, stack: err.stack });
	});

	server.listen(config.port, function() {
		winston.info('Listening on port ' + config.port);
		console.log('## Ungit started ##'); // Consumed by bin/ungit to figure out when the app is started
	});
	
