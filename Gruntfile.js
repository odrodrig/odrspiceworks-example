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
        files: [{
          cwd: 'bower_components',
          src: ['oasis.js/dist/oasis.amd.js','conductor.js/dist/conductor-0.3.0.amd.js'],
          dest: 'tmp/vendor/',
          expand: true,
          flatten: true
        }, {
          cwd: 'node_modules',
          src: ['rsvp/dist/rsvp-3.0.9.amd.js'],
          dest: 'tmp/vendor/',
          expand: true,
          flatten: true
        }]
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
        'jshintrc': '.jshintrc'
      },
      all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
    },
    mocha: {
      test: {
        src: ['test/**/*.html'],
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
  grunt.registerTask('default', ['mocha']);

  // Specific tasks
  grunt.registerTask('build', ['clean', 'jshint', 'transpile', 'copy:vendor', 'concat', 'browser', 'uglify']);
  grunt.registerTask('test', ['mocha']);
  grunt.registerTask('hint', ['jshint']);

};
