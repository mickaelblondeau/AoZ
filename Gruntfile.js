module.exports = function(grunt) {

    grunt.initConfig({
        watch: {
            app: {
                files: ['src/app/*.coffee', 'src/app/Classes/*.coffee'],
                tasks: ['concat:app', 'coffee:app']
            },
            server: {
                files: ['src/server/*.coffee', 'src/server/Classes/*.coffee'],
                tasks: ['concat:server', 'coffee:server']
            }
        },
        concat: {
            app: {
                src: [
                    'src/shared/*.coffee',
                    'src/app/Classes/*.coffee',
                    'src/app/main.coffee',
                ],
                dest: 'src/tmp/app.coffee'
            },
            server: {
                src: [
                    'src/shared/*.coffee',
                    'src/server/Classes/*.coffee',
                    'src/server/main.coffee',
                ],
                dest: 'src/tmp/server.coffee'
            }
        },
        coffee: {
            app: {
                files: {
                    'app/js/app.js': ['src/tmp/app.coffee']
                }
            },
            server: {
                files: {
                    'server/server.js': ['src/tmp/server.coffee']
                }
            }
        },
        uglify: {
            app: {
                src: 'app/js/app.js',
                dest: 'app/js/app.min.js'
            },
            server: {
                src: 'server/server.js',
                dest: 'server/server.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', 'watch');
};