
var helpers = require('./helpers');
var testsuite = require('./testsuite');
var Environment = require('./environment');
var webpage = require('webpage');
var uiInteractions = require('./ui-interactions.js');

var page = webpage.create();
var suite = testsuite.newSuite('plugins', page);

var environment;

suite.test('Init', function(done) {
  environment = new Environment(page, {
    port: 8457,
    serverStartupOptions: ['--pluginDirectory=' + phantom.libraryPath + '/test-plugins']
  });
  environment.init()
    .then(function() { done(); })
    .catch(done);
});

suite.test('Plugin should replace all of the app', function(done) {
  uiInteractions.open(page, environment.url)
    .then(function() { return helpers.waitForElementVisible(page, '[data-ta-element="dummy-app"]'); })
    .then(function() {
      if (helpers.elementVisible(page, '[data-ta-container="app"]')) {
        throw new Error('Should not find app');
      }
    }).then(function() { done(); })
    .catch(done);
});

suite.test('Shutdown', function(done) {
  environment.shutdown()
    .then(function() { done(); })
    .catch(done);
});

testsuite.runAllSuits();
