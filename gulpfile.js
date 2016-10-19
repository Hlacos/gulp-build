'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var cleanCSS = require('gulp-clean-css');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var csslint = require('gulp-csslint');
var sassLint = require('gulp-sass-lint');
var webserver = require('gulp-webserver');
var tinylr = require('tiny-lr');
var jade = require('gulp-jade');
var jadelint = require('gulp-jade-lint');
var data = require('gulp-data');
var fs = require('fs');
var yamlData = require('gulp-yaml-data');
var MongoClient = require('mongodb').MongoClient;

gulp.task('default', ['minify-css', 'minify-js', 'templates'], function() {
  console.log('default task');
});

/* Use this hint if use sass */
gulp.task('sass-hint', function () {
  return gulp.src('./resources/assets/sass/**/*.scss')
    .pipe(sassLint())
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
});

/* CSS */
gulp.task('sass', ['sass-hint'], function () {
  return gulp.src('./resources/assets/sass/style.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./site/public/css'));
});

/* Use this if not use sass */
/*gulp.task('css-hint', function() {
  gulp.src('./site/public/css/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter());
});*/

gulp.task('minify-css', ['sass'/*css-hint*/], function() {
  return gulp.src('./site/public/css/*.css')
    .pipe(sourcemaps.init())
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./site/public/build/css'));
});

/* JS */

/* Modify src if not use babel */
gulp.task('js-hint', function() {
  return gulp.src('./resources/assets/babel/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter());
});

gulp.task('babel', ['js-hint'], function() {
  return gulp.src('./resources/assets/babel/**/*.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('./site/public/js/'));
});

gulp.task('minify-js', ['babel'/*js-hint*/], function() {
  return gulp.src('./site/public/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(concat('application.min.js'))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./site/public/build/js'));
});

/* HTML */
gulp.task('jade-lint', function () {
  return gulp
    .src('./resources/views/jade/**/*.jade')
    .pipe(jadelint());
});

gulp.task('templates', ['jade-lint'], function() {
  gulp.src(['./resources/views/jade/**/*.jade', '!./resources/views/jade/partials/*.jade'])
    // data from json file (require fs and gulp-data)
    .pipe(data( function(file) {
      return JSON.parse(
        fs.readFileSync('./resources/data/json/data.json')
      );
    }))
    // data from yml file (require gulp-yaml-data)
    /*.pipe(yamlData({
      src: './resources/data/yaml/data.yml'
    }))*/
    // data from mongodb file (require gulp-data and mongodb)
    /*.pipe(data(function(file, cb) {
      MongoClient.connect('mongodb://127.0.0.1:27017/gulptest', function(err, db) {
        if(err) return cb(err);

        db.collection('articles').find({}).toArray(function(err, docs) {
            cb(undefined, {'articles': docs});
            db.close();
        });
      });
    }))*/
    .pipe(jade({
      pretty: true
    }).on('error', function(err) {
      console.log(err);
    }))
    .pipe(gulp.dest('./site'))
});

/* Serve change ip */
gulp.task('webserver', function() {
  gulp.src('site')
  .pipe(webserver({
    host: '10.0.1.89',
    livereload: true,
    open: true
  }));
});

/* watch */

gulp.task('watch', function () {
  tinylr().listen(35729, function (err) {
    if (err) {
      return console.log(err);
    }

    gulp.watch('./resources/assets/sass/**/*.scss', ['sass']);
    gulp.watch('./resources/assets/babel/**/*.js', ['babel'/*js-hint*/]);
    gulp.watch('./resources/views/jade/**/*.jade', ['templates']);
    // Comment out if not use json format
    gulp.watch('./resources/data/json/data.json', ['templates']);
    // Uncomment if use yaml source
    /*gulp.watch('./resources/data/yaml/data.yml', ['templates']);*/
  });
});
