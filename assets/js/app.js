
var AppViewModel = function(main) {
	var self = this;
	this.content = ko.observable(main);
	api.disconnected.add(function() {
		self.content(new UserErrorViewModel('Connection lost', 'Refresh the page to try to reconnect'));
	});
}
AppViewModel.prototype.updateAnimationFrame = function(deltaT) {
	if (this.content() && this.content().updateAnimationFrame) this.content().updateAnimationFrame(deltaT);
}
AppViewModel.prototype.templateChooser = function(data) {
	if (!data) return '';
	return data.template;
};

var MainViewModel = function() {
	var self = this;
	this.path = ko.observable();
	this.dialog = ko.observable(null);
	this.isAuthenticated = ko.observable(!ungit.config.authentication);
	this.realContent = ko.observable(new HomeViewModel());
	this.currentVersion = ko.observable();
	this.latestVersion = ko.observable();
	this.newVersionAvailable = ko.observable();
	this.showBugtrackingNagscreen = ko.observable(!ungit.config.bugtracking && !localStorage.getItem('bugtrackingNagscreenDismissed'));
	this.programEvents = new signals.Signal();
	this.programEvents.add(function(event) {
		console.log('Event:', event);
	});
	api.query('GET', '/latestversion', undefined, function(err, version) {
		self.currentVersion(version.currentVersion);
		self.latestVersion(version.latestVersion);
		self.newVersionAvailable(version.outdated);
	});
	if (ungit.config.authentication) {
		this.authenticationScreen = new LoginViewModel();
		this.authenticationScreen.loggedIn.add(function() {
			self.isAuthenticated(true);
		});
	}
	this.content = ko.computed({
		write: function(value) {
			self.realContent(value);
		},
		read: function() {
			if (self.isAuthenticated()) return self.realContent();
			else return self.authenticationScreen;
		}
	});
	api.getCredentialsHandler = function(callback) {
		var diag = new CredentialsDialogViewModel();
		self.programEvents.dispatch({ event: 'credentialsRequested' });
		diag.closed.add(function() {
			self.programEvents.dispatch({ event: 'credentialsProvided' });
			callback({ username: diag.username(), password: diag.password() });
		});
		self.showDialog(diag);
	}
}
MainViewModel.prototype.template = 'main';
MainViewModel.prototype.updateAnimationFrame = function(deltaT) {
	if (this.content() && this.content().updateAnimationFrame) this.content().updateAnimationFrame(deltaT);
}
MainViewModel.prototype.submitPath = function() {
	browseTo('repository?path=' + encodeURIComponent(this.path()));
}
MainViewModel.prototype.showDialog = function(dialog) {
	var self = this;
	dialog.closed.add(function() {
		self.dialog(null);
	})
	this.dialog(dialog);
}
MainViewModel.prototype.enableBugtrackingAndStatistics = function() {
	var self = this;
	api.query('POST', '/enablebugtrackingandstats', undefined, function(err) {
		if (err) return;
		self.showBugtrackingNagscreen(false);
	});
}
MainViewModel.prototype.enableBugtracking = function() {
	var self = this;
	api.query('POST', '/enablebugtracking', undefined, function(err) {
		if (err) return;
		self.showBugtrackingNagscreen(false);
	});
}
MainViewModel.prototype.dismissBugtrackingNagscreen = function() {
	this.showBugtrackingNagscreen(false);
	localStorage.setItem('bugtrackingNagscreenDismissed', true);
}
MainViewModel.prototype.templateChooser = function(data) {
	if (!data) return '';
	return data.template;
};

var visitedRepositories = {
	getAll: function() {
		return JSON.parse(localStorage.getItem('visitedRepositories') || '[]');
	},
	tryAdd: function(path) {
		var repos = this.getAll();
		var i;
		while((i = repos.indexOf(path)) != -1)
			repos.splice(i, 1);

		repos.unshift(path);
		localStorage.setItem('visitedRepositories', JSON.stringify(repos));
	}
}


function CredentialsDialogViewModel() {
	this.username = ko.observable();
	this.password = ko.observable();
	this.closed = new signals.Signal();
}
CredentialsDialogViewModel.prototype.template = 'credentialsDialog';
CredentialsDialogViewModel.prototype.setCloser = function(closer) {
	this.close = closer;
}
CredentialsDialogViewModel.prototype.onclose = function() {
	this.closed.dispatch();
}

function HomeViewModel() {
	this.repos = visitedRepositories.getAll().map(function(path) {
		return {
			title: path,
			link: '/#/repository?path=' + encodeURIComponent(path)
		};
	});
}
HomeViewModel.prototype.template = 'home';

var CrashViewModel = function() {
}
CrashViewModel.prototype.template = 'crash';

var LoginViewModel = function() {
	var self = this;
	this.loggedIn = new signals.Signal();
	this.status = ko.observable('loading');
	this.username = ko.observable();
	this.password = ko.observable();
	this.loginError = ko.observable();
	api.query('GET', '/loggedin', undefined, function(err, status) {
		if (status.loggedIn) {
			self.loggedIn.dispatch();
			self.status('loggedIn');
		}
		else self.status('login');
	});
}
LoginViewModel.prototype.login = function() {
	var self = this;
	api.query('POST', '/login',  { username: this.username(), password: this.password() }, function(err, res) {
		if (err) {
			if (err.res.body.error) {
				self.loginError(err.res.body.error);
				return true;
			}
		} else {
			self.loggedIn.dispatch();
			self.status('loggedIn');
		}
	});
}
LoginViewModel.prototype.template = 'login';

var UserErrorViewModel = function(args) {
	if (typeof(arguments[0]) == 'string')
		args = { title: arguments[0], details: arguments[1] };
	args = args || {};
	this.title = ko.observable(args.title);
	this.details = ko.observable(args.details);
}
UserErrorViewModel.prototype.template = 'usererror';

var PathViewModel = function(main, path) {
	var self = this;
	this.main = main;
	this.path = path;
	this.status = ko.observable('loading');
	this.loadingProgressBar = new ProgressBarViewModel('path-loading-' + path);
	this.loadingProgressBar.start();
	this.cloningProgressBar = new ProgressBarViewModel('path-loading-' + path, 10000);
	this.cloneUrl = ko.observable();
	this.cloneDestinationImplicit = ko.computed(function() {
		var defaultText = 'destination folder';
		if (!self.cloneUrl()) return defaultText;
		var ss = self.cloneUrl().split('/');
		if (ss.length == 0) return defaultText;
		var s = _.last(ss);
		if (s.indexOf('.git') == s.length - 4) s = s.slice(0, -4);
		if (!s) return defaultText;
		return s;
	});
	this.cloneDestination = ko.observable();
	this.repository = ko.observable();
}
PathViewModel.prototype.template = 'path';
PathViewModel.prototype.shown = function() {
	this.updateStatus();
}
PathViewModel.prototype.updateAnimationFrame = function(deltaT) {
	if (this.repository())
		this.repository().updateAnimationFrame(deltaT);
}
PathViewModel.prototype.updateStatus = function() {
	var self = this;
	api.query('GET', '/status', { path: this.path }, function(err, status){
		self.loadingProgressBar.stop();
		if (!err) {
			self.status('repository');
			self.repository(new RepositoryViewModel(self.main, self.path));
		} else if (err.errorCode == 'not-a-repository') {
			self.status('uninited');
			return true;
		} else if (err.errorCode == 'no-such-path') {
			self.status('invalidpath');
			return true;
		}
	});
}
PathViewModel.prototype.initRepository = function() {
	var self = this;
	api.query('POST', '/init', { path: this.path }, function(err, res) {
		if (err) return;
		self.updateStatus();
	});
}
PathViewModel.prototype.cloneRepository = function() {
	var self = this;
	self.status('cloning');
	this.cloningProgressBar.start();
	var dest = this.cloneDestination() || this.cloneDestinationImplicit();
	api.query('POST', '/clone', { path: this.path, url: this.cloneUrl(), destinationDir: dest }, function(err, res) {
		self.cloningProgressBar.stop();
		if (err) return;
		browseTo('repository?path=' + encodeURIComponent(self.path + '/' + dest));
	});
}


crossroads.addRoute('/', function() {
	main.path('');
	main.content(new HomeViewModel());
});

crossroads.addRoute('/repository{?query}', function(query) {
	main.path(query.path);
	main.content(new PathViewModel(main, query.path));
})
