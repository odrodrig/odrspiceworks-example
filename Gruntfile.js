/*global module:false*/
module.exports = function(grunt) {

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    clean: ["tmp", "dist/*"],
    copy: {
      vendor: {
        cwd: 'bower_components',
        src: ['rsvp/rsvp.amd.js','oasis.js/dist/oasis.amd.js','conductor.js/dist/conductor-0.3.0.amd.js'],
        dest: 'tmp/vendor/',
        expand: true,
        flatten: true
      },
      tests: {
        files: [{
          src: ['<%= browser.distNoVersion.dest %>'],
          dest: 'tmp/public/',
          expand: true,
          flatten: true
        }, {
          cwd: 'test/',
          src: ['index.html', 'fixtures/**'],
          dest: 'tmp/public/',
          expand: true
        }]
      },

      testsVendor: {
        expand: true,
        cwd: 'bower_components',
        src: [
          'mocha/mocha.{js,css}',
          'chai/chai.js',
          'conductor.js/dist/conductor-0.3.0.js'
        ],
        flatten: true,
        dest: 'tmp/public/vendor/'
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      amd: {
        src: [
          'tmp/vendor/**/*.amd.js',
          'tmp/<%= pkg.name %>/**/*.amd.js',
          'tmp/<%= pkg.name %>.amd.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.amd.js'
      },
      amdNoVersion: {
        src: [
          'tmp/vendor/**/*.amd.js',
          'tmp/<%= pkg.name %>/**/*.amd.js',
          'tmp/<%= pkg.name %>.amd.js'
        ],
        dest: 'dist/<%= pkg.name %>.amd.js'
      },
      browser: {
        src: [
          'vendor/loader.js',
          'tmp/vendor/**/*.amd.js',
          'tmp/<%= pkg.name %>/**/*.amd.js',
          'tmp/<%= pkg.name %>.amd.js'
        ],
        dest: 'tmp/<%= pkg.name %>.browser1.js'
      },
      tests: {
        src: ['test/helpers/*', 'test/tests/**/*.js'],
        dest: 'tmp/public/sw_js_sdk_tests.js'
      }
    },
    browser: {
      dist: {
        src: 'tmp/<%= pkg.name %>.browser1.js',
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      },
      distNoVersion: {
        src: 'tmp/<%= pkg.name %>.browser1.js',
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      browser: {
        options: {
          mangle: true
        },
        files: {
          'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['dist/<%= pkg.name %>-<%= pkg.version %>.js'],
        }
      },
      browserNoVersion: {
        options: {
          mangle: true
        },
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js'],
        }
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      grunt: {
        src: 'Gruntfile.js'
      },
      src: {
        src: 'lib/**/*.js'
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        expand: true,
        src: 'test/**/*.js'
      }
    },
    mocha: {
      test: {
        src: ['tmp/public/**/*.html'],
        options: {
          run: true,
          reporter: 'Nyan'
        }
      }
    },
    transpile: {
      amd: {
        type: "amd",
        files: [{
          expand: true,
          cwd: 'lib/',
          src: ['**/*.js'],
          dest: 'tmp/',
          ext: '.amd.js'
        }]
      }
    },
    watch: {
      files: ['**/*'],
      tasks: ['jshint', 'mocha']
    }
  });

  // For creating globals out of transpiled AMD modules
  grunt.registerMultiTask('browser', 'Export the object in <%= pkg.name %> to the window', function() {
    this.files.forEach(function(f) {
      var output = ['(function(global) {'];

      output.push.apply(output, f.src.map(grunt.file.read));

      output.push("global.<%= pkg.namespace %> = require('<%= pkg.name %>');");
      output.push('}(self));');

      grunt.file.write(f.dest, grunt.template.process(output.join('\n')));
    });
  });

  // Default task.
  grunt.registerTask('default', ['test']);

  // Specific tasks
  grunt.registerTask('build', ['clean', 'jshint', 'transpile', 'copy:vendor', 'concat', 'browser', 'uglify']);
  grunt.registerTask('prepare_test', "Setup the test environment", ['build', 'concat:tests', 'copy:tests', 'copy:testsVendor']);
  grunt.registerTask('test', ['prepare_test', 'mocha']);
  grunt.registerTask('hint', ['jshint']);

};
