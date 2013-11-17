module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: [
          'src/intro.js',
          'src/ssa.js',
          'src/parser.js',
          'src/parser/*',
          'src/player.js',
          'src/util.js',
          'src/outro.js'
        ],
        dest: 'dist/ssa.js'
      }
    },
    uglify: {
      all: {
        options: {
          preserveComments: false
        },
        files: {
          'dist/ssa.min.js': ['dist/ssa.js']
        }
      }
    },
    watch: {
      files: ['src/**/*.js'],
      tasks: 'dev'
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('dev', ['concat']);
  grunt.registerTask('default', ['dev', 'uglify']);
};