module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		// Copy the uncompressed library to dist
		copy: {
			dist: {
				src: "lib/bounceback.js",
				dest: "dist/bounceback.js"
			}
		},

		// Uglify the library and create the .min.js file
		uglify: {
			dist: {
				src: "lib/bounceback.js",
				dest: "dist/bounceback.min.js",
				options: {
					banner: "/* Bounceback.js v<%= pkg.version %> | Copyright 2014 Avi Kohn | Distributable under the MIT license */\n"
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-uglify");

	grunt.registerTask("default", ["copy", "uglify"]);
};