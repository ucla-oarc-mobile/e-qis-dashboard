/*global module:false*/
module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          targetDir: 'requires',
          layout: 'byComponent'
        }
      }
    },
    browserify: {
      dev: {
        files: {
          'build/app.js': ['client/src/**/*.js']
        },
        options: {
          // transform: [['babelify', { presets: ["es2015"] }]],
          browserifyOptions: {
            debug: true // enable source maps
          }
        }
      },
      prod: {
        files: {
          'build/app.js': ['client/src/**/*.js']
        },
        options: {
          external: ['jquery', 'underscore', 'backbone', 'backbone.marionette'],
          // transform: [['babelify', { presets: ["es2015"] }]]
        }
      }
    },
    clean: {
      build: ['build'],
      img: ['build/images'],
      prod: ['dist']
    },
    compress: {
      main : {
        options: {
          archive: 'dist/<%= pkg.name %>.tgz',
          mode: 'tgz'
        },
        files: [
          {cwd: "dist/", expand: true, dest: 'dist/', src: ['**']}
        ]
      }
    },
    concat: {
      prod: {
        src: [
          'build/vendor.js',
          'build/templates.js',
          'build/app.js',
        ],
        dest: 'build/<%= pkg.name %>.js'
      },
      vendor: {
        src: [
          'requires/underscore/js/underscore.js',
          'requires/jquery/js/jquery.js',
          'requires/backbone/js/backbone.js',
          'requires/backbone.marionette/js/backbone.marionette.js',
          'requires/bootstrap/js/bootstrap.js',
          'requires/jszip/jszip.js',
          'requires/file-saver/FileSaver.js',
          'requires/jquery.panzoom/jquery.panzoom.js',
          'client/vendor/jquery.cookie.js',
          'client/vendor/ohmage.js',
          'client/vendor/ConditionalParser.js',
        ],
        dest: 'build/vendor.js',
        options: {
          sourceMap: true
        }
      }
    },
    concurrent: {
      dev: {
        tasks: ['watch:scripts','watch:images', 'watch:less', 'watch:pug', 'watch:templates', 'http-server:dev'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    copy: {
      img: {
        files: [{
          expand: true,
          cwd: 'client/img/',
          src: ['**'],
          dest: 'build/images/'
        }]
      },
      icon: {
        files: [{
          expand: true,
          cwd: 'client/img/',
          src: ['favicon.ico','mobile-icon.png'],
          dest: 'build/'
        }]
      },
      iconprod: {
        files: [{
          expand: true,
          cwd: 'client/img/',
          src: ['favicon.ico','mobile-icon.png'],
          dest: 'dist/'
        }]
      },
      prod: {
        files: [{
          expand: true,
          cwd: 'client/img/',
          src: ['**'],
          dest: 'dist/images/'
        }]
      }
    },
    cssmin: {
      minify: {
        options: {
          sourceMap: false
        },
        src: ['build/<%= pkg.name %>.css'],
        dest: 'dist/<%= pkg.name %>.css'
      }
    },
    exec: {
      git_revision: {
        cmd: 'git log --pretty=format:%h -1 > dist/git.txt'
      }
    },
    "http-server": {
      dev: {
        root: "build",
        port: 8089,
        host: "0.0.0.0",
        proxy: "https://staging.mobilizelabs.org"
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: false,
        unused: false,
        boss: true,
        eqnull: true,
        globals: {
          jQuery: true,
          Backbone: true,
          _: true,
          app: true,
          oh: true
        }
      },
      all: {
        src: ['Gruntfile.js', 'client/src/**/*.js']
      },
      dev: {
        src: ['client/src/**/*.js']
      }
    },
    less: {
      transpile: {
        files: {
          'build/<%= pkg.name %>.css': [
            'client/styles/less/all.less'
          ]
        }
      }
    },
    mkdir: {
      build: {
        options: {
          mode: 0755,
          create: ['build']
        },
      },
    },
    pug: {
      dev: {
        options: {
          pretty: true,
          data: {
            pkg: grunt.file.readJSON('package.json'),
            debug: true
          }
        },
        files: {
          'build/index.html': ['client/src/index.pug']
        }
      },
      prod: {
        options: {
          data: {
            pkg: grunt.file.readJSON('package.json'),
            debug: false
          }
        },
        files: {
          'dist/index.html': ['client/src/index.pug']
        }
      }
    },
    "template-module": {
      compile: {
        options: {
          module: false,
          provider: "underscore",
          requireProvider: false,
          processName: function(filename) {
            // strip the prefix from the filename
            var noPrefixFileName = filename.substring('client/'.length);
            return noPrefixFileName;
          }
        },
        files: {
          'build/templates.js': ['client/templates/**/*.html']
        },
      }
    },
    uglify: {
      compile: {
        options: {
          compress: true,
          verbose: true
        },
        files: [{
          src: 'build/<%= pkg.name %>.js',
          dest: 'dist/<%= pkg.name %>.js'
        }]
      }
    },
    watch: {
      scripts: {
        files: ['client/src/**/*.js'],
        tasks: ['jshint:dev', 'browserify:dev']
      },
      images: {
        files: ['client/img/*'],
        tasks: ['clean:img','copy:img']
      },
      less: {
        files: ['client/styles/**/*.less'],
        tasks: ['less:transpile']
      },
      pug: {
        files: ['client/src/index.pug'],
        tasks: ['pug:dev']
      },
      templates: {
        files: ['client/templates/**/*.html'],
        tasks: ['template-module']
      }
    },
  });

  grunt.registerTask('init:lib', [
    'clean:build',
    'mkdir:build',
    'bower:install',
    'concat:vendor'
  ]);

  grunt.registerTask('build:dev', [
    'jshint:dev',
    'copy:img',
    'copy:icon',
    'template-module',
    'browserify:dev',
    'less:transpile',
    'pug:dev',
  ]);

  grunt.registerTask('buildwatch:dev', [
    'build:dev',
    'concurrent:dev'
  ]);

  grunt.registerTask('build:prod', [
    'init:lib',
    'jshint:all',
    'clean:prod',
    'copy:prod',
    'copy:iconprod',
    'template-module',
    'browserify:prod',
    'less:transpile',
    'pug:prod',
    'concat:prod',
    'cssmin',
    'uglify',
    'exec:git_revision',
    'compress:main'
  ]);
};
