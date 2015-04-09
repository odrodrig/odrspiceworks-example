/*global module:false*/
module.exports = function(grunt) {

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  var vendorSources = [
    'vendor/loader.js',
    'bower_components/UUID.js/dist/uuid.core.js',
    'bower_components/kamino.js/lib/kamino.js',
    'bower_components/MessageChannel.js/lib/message_channel.js',
    'bower_components/rsvp/rsvp.amd.js',
    'bower_components/oasis.js/dist/oasis.amd.js',
    'bower_components/crypto-js/crypto-js.js',
    'bower_components/crypto-js/core.js',
    'bower_components/crypto-js/cipher-core.js',
    'bower_components/crypto-js/enc-base64.js',
    'bower_components/crypto-js/md5.js',
    'bower_components/crypto-js/sha1.js',
    'bower_components/crypto-js/hmac.js',
    'bower_components/crypto-js/evpkdf.js',
    'bower_components/crypto-js/aes.js',
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
        cwd: 'test/',
        src: ['index.html', 'fixtures/**'],
        dest: 'tmp/public/',
        expand: true
      },
      testsVendor: {
        expand: true,
        cwd: 'bower_components',
        src: [
          'mocha/mocha.{js,css}',
          'chai/chai.js'
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
      libAmd: {
        src: ['tmp/lib/**/*.amd.js'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.amd.js'
      },
      libAmdNoVersion: {
        src: ['tmp/lib/**/*.amd.js'],
        dest: 'dist/<%= pkg.name %>.amd.js'
      },
      libBrowser: {
        src: vendorSources.concat(['tmp/lib/**/*.amd.js']),
        dest: 'tmp/<%= pkg.name %>.browser.js'
      },
      hostBrowser: {
        src: vendorSources.concat(['tmp/host/**/*.amd.js']),
        dest: 'tmp/<%= pkg.name %>-host.browser.js'
      },
      tests: {
        src: vendorSources.concat(['tmp/host/**/*.amd.js','tmp/test/**/*.js']),
        dest: 'tmp/sw-sdk-tests.browser.js'
      }
    },
    browser: {
      libDist: {
        options: {
          namespace: '<%= pkg.namespace %>',
          moduleName: '<%= pkg.name %>'
        },
        files: [{
          src: 'tmp/<%= pkg.name %>.browser.js',
          dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
        },{
          src: 'tmp/<%= pkg.name %>.browser.js',
          dest: 'dist/<%= pkg.name %>.js'
        }]
      },
      hostDist: {
        options: {
          namespace: '<%= pkg.namespace %>',
          moduleName: 'spiceworks-sdk-host'
        },
        src: 'tmp/<%= pkg.name %>-host.browser.js',
        dest: 'dist/<%= pkg.name %>-host.js'
      },
      tests: {
        options: {
          namespace: 'TESTS',
          moduleName: 'test/main'
        },
        src: 'tmp/sw-sdk-tests.browser.js',
        dest: 'tmp/public/sw-sdk-tests.js'
      }
    },
    uglify: {
      lib: {
        options: {
          mangle: true
        },
        files: {
          'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['dist/<%= pkg.name %>-<%= pkg.version %>.js'],
        }
      },
      libNoVersion: {
        options: {
          mangle: true
        },
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js'],
        }
      },
      host: {
        options: {
          mangle: true
        },
        files: {
          'dist/<%= pkg.name %>-host.min.js': ['dist/<%= pkg.name %>-host.js'],
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
      lib: {
        src: 'lib/**/*.js'
      },
      host: {
        src: 'host/**/*.js'
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
      lib: {
        type: "amd",
        files: [{
          expand: true,
          cwd: 'lib/',
          src: ['**/*.js'],
          dest: 'tmp/lib/',
          ext: '.amd.js'
        }]
      },
      host: {
        type: "amd",
        files: [{
          expand: true,
          cwd: 'host/',
          src: ['**/*.js'],
          dest: 'tmp/host/',
          ext: '.amd.js'
        }]
      },
      test: {
        type: "amd",
        files: [{
          expand: true,
          src: ['test/main.js', 'test/tests/*.js', 'test/helpers/**/*.js'],
          dest: 'tmp',
          ext: '.amd.js'
        }]
      }
    },
    watch: {
      files: [
        'lib/**',
        'host/**',
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
  grunt.registerMultiTask('browser', 'Export the object in <%= moduleName %> to the window', function() {
    var opts = this.options();
    this.files.forEach(function(f) {
      var output = ['(function(global) {'];

      output.push.apply(output, f.src.map(grunt.file.read));

      output.push(grunt.template.process(
      'window.<%= namespace %> = require("<%= moduleName %>");', {
        data: {
          namespace: opts.namespace,
          moduleName: opts.moduleName
        }
      }));
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
