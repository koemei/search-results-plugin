'use strict';

/**
 * Module dependencies.
 */
var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');
var minifyCss = require('gulp-minify-css');
var runSequence = require('run-sequence');

// copies css file (as style.css) to dist and creates a minified version (style.min.css)
gulp.task('css', function(){
  return gulp.src(['src/search-results.css'])
    .pipe(rename('style.css'))
    .pipe(gulp.dest('dist'))
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('dist'));
});

// copies js file (as plugin.js) to dist and creates a minified version (plugin.min.js)
gulp.task('ugligy', function(){
  return gulp.src(['src/search-results.js'])
    .pipe(rename('plugin.js'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('plugin.min.js'))
    .pipe(gulp.dest('dist'));
});

// concat all
gulp.task('concat', function(){
  return gulp.src(['', 'dist/typeahead.min.js', 'dist/plugin.min.js'])
    .pipe(concat('search-results.min.js'))
    .pipe(insert.prepend('/*!\n* KoemeiSearchResults.min.js 0.0.1\n*/\n'))
    .pipe(rename('plugin.bundle.min.js'))
    .pipe(gulp.dest('dist'))

});

// build the minified version to /dist
gulp.task('build', function (done) {
  runSequence('ugligy', 'concat', 'css', done);
});


// Run the project in development mode
gulp.task('default', function (done) {

});


