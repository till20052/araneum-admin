var path = require('path'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch'),
    del = require('del');

var settings = require('./settings');

gulp.task('clean', function () {
    return del(Object.keys(settings).map(function (key) {
        return settings[key].dist.path + '/*';
    })).then(function (path) {
        console.log("[clean]:\n\t" + path.join('\n\t'));
    });
});

gulp.task('build:scripts', function () {
    var src = settings.scripts.src,
        dist = settings.scripts.dist;
    return gulp.src(src.filter.map(function (pattern) {
            return path.join(src.path, pattern);
        }))
        .pipe(concat(dist.name))
        .pipe(gulp.dest(dist.path))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(dist.path));
});

gulp.task('build:views', function () {
    var src = settings.views.src,
        dist = settings.views.dist;
    return gulp.src(path.join(src.path, src.filter))
        .pipe(gulp.dest(dist.path));
});

gulp.task('build', ['clean', 'build:scripts', 'build:views']);

gulp.task('default', ['build'], function () {
    Object.keys(settings).map(function (key) {
        var src = settings[key].src;
        if (src.filter.constructor !== Array) {
            src.filter = [src.filter];
        }
        watch(src.filter.map(function (pattern) {
            return path.join(src.path, pattern);
        }), batch(function (events, done) {
            gulp.start('build:' + key, done);
        }));
    });
});