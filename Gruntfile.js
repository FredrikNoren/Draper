var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var path = require('path');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      production: {
        files: {
          "public/css/styles.css": ["public/less/styles.less", "public/vendor/css/animate.css", 'public/vendor/css/jquery-ui-1.10.3.custom.css']
        }
      }
    },
    browserify: {
      options: {
        noParse: ['public/vendor/js/superagent.js'],
        debug: true
      },
      dist: {
        files: {
          'public/js/ungit.js': ['public/source/main.js']
        }
      }
    },
    watch: {
      scripts: {
        files: ['public/source/*.js', 'source/*.js'],
        tasks: ['browserify'],
        options: {
          spawn: false,
        },
      },
      less: {
        files: ['public/less/*.less', 'public/styles/*.less'],
        tasks: ['less:production'],
        options: {
          spawn: false,
        },
      },
    },
    lineending: {
      // Debian won't accept bin files with the wrong line ending
      production: {
        options: {
          eol: 'lf'
        },
        files: {
          './bin/ungit': ['./bin/ungit'],
          './bin/credentials-helper': ['./bin/credentials-helper']
        }
      },
    },
    release: {
      options: {
        commitMessage: 'Release <%= version %>',
      }
    },
    // Run mocha tests
    simplemocha: {
      options: {
        reporter: 'spec'
      },

      all: { src: 'test/*.js' }
    },
    // Plato code analysis
    plato: {
      all: {
        files: {
          'report': ['source/**/*.js', 'public/source/**/*.js'],
        }
      },
    },

    // Minify images (basically just lossless compression)
    imagemin: {
      default: {
        options: {
          optimizationLevel: 3
        },
        files: [{
          expand: true,
          cwd: 'assets/client/images/',
          src: ['**/*.png'],
          dest: 'public/images/'
        }]
      }
    },

    // Embed images in css
    imageEmbed: {
      default: {
        src: [ "public/css/styles.css" ],
        dest: "public/css/styles.css",
        options: {
          deleteAfterEncoding: false
        }
      }
    },
  });

  grunt.registerTask('clicktest', 'Run clicktests.', function() {
    var done = this.async();
    grunt.log.writeln('Running clicktests...');
    var child = childProcess.execFile(phantomjs.path, [path.join(__dirname, 'clicktests', 'clicktests.js')]);
    child.stdout.on('data', function(data) {
      grunt.log.write(data);
    });
    child.stderr.on('data', function(data) {
      grunt.log.error(data);
    })
    child.on('exit', function(code) {
      done(code == 0);
    });
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-lineending');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-plato');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-image-embed');

  // Default task, builds everything needed
  grunt.registerTask('default', ['less:production', 'browserify', 'lineending:production', 'imagemin:default', 'imageEmbed:default']);

  // Run tests
  grunt.registerTask('test', ['simplemocha', 'clicktest']);

  // Builds, and then creates a release (bump patch version, create a commit & tag, publish to npm)
  grunt.registerTask('publish', ['default', 'test', 'release:patch']);

};
