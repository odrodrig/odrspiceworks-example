/*global module:false*/
module.exports = function(grunt) {

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  var vendorSources = [
    'vendor/loader.js',
    'bower_components/UUID.js/dist/uuid.core.js',
    'bower_components/kamino.js/lib/kamino.js',
    'bower_components/MessageChannel.js/lib/message_channel.js',
    'bower_components/rsvp/rsvp.amd.js',
    'bower_components/oasis.js/dist/oasis.amd.js'
  ];

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
          'oasis.js/dist/oasis.js'
        ],
        flatten: true,
        dest: 'tmp/public/vendor/'
      },

      testSDK: {
        expand: true,
        cwd: 'dist',
        src: ['spiceworks-sdk.js'],
        dest: 'tmp/public/'
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      amd: {
        src: ['tmp/amd/**/*.amd.js'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.amd.js'
      },
      amdNoVersion: {
        src: ['tmp/amd/**/*.amd.js'],
        dest: 'dist/<%= pkg.name %>.amd.js'
      },
      browser: {
        src: vendorSources.concat(['tmp/amd/**/*.amd.js']),
        dest: 'tmp/<%= pkg.name %>.browser.js'
      },
      tests: {
        src: ['tmp/test/**/*.js'],
        dest: 'tmp/public/sw_js_sdk_tests.js'
      }
    },
    browser: {
      dist: {
        src: 'tmp/<%= pkg.name %>.browser.js',
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      },
      distNoVersion: {
        src: 'tmp/<%= pkg.name %>.browser.js',
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
        src: 'test/*.js'
      }
    },
    mocha: {
      test: {
        options: {
          run: true,
          reporter: 'Nyan',
          urls: [ 'http://localhost:8000/' ]
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
          dest: 'tmp/amd/',
          ext: '.amd.js'
        }]
      },
      test: {
        type: "amd",
        files: [{
          expand: true,
          src: ['test/*.js', 'test/helpers/**/*.js'],
          dest: 'tmp',
          ext: '.amd.js'
        }]
      }
    },
    watch: {
      files: [
       'lib/**',
        'test/**',
        'bower_components/**/*.js',
        'vendor/**'
      ],
      tasks: ['build']
    },
    connect: {
      options: {
        base: 'tmp/public',
        hostname: '*'
      },
      server: {
        options: {
          port: 8000,
        }
      },
      crossOriginServer: {
        options: {
          port: 8001,
        }
      }
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
  grunt.registerTask('build', ['clean', 'jshint', 'transpile', 'concat', 'browser', 'uglify', 'copy']);
  grunt.registerTask('test', ['build', 'connect', 'watch']);
  grunt.registerTask('hint', ['jshint']);

};
