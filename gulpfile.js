var path = require('path'),
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    del = require('del');

var settings = require('./settings');

var paths = {
    src: 'src',
    dest: 'dest'
};
var crud = {
    name: 'crud',
    path: 'js',
    mask: [
        '*.module.js',
        '**/*.module.js',
        '**/*.config.js',
        '**/*.*.js'
    ]
};

gulp.task('clean', function () {
    return del([]);
});

gulp.task('build:scripts', function () {
    gulp.src((function (mask, src) {
            return mask.map(function (pattern) {
                return path.join(paths.src, src, pattern);
            });
        })(crud.mask, crud.path))
        .pipe(gulpConcat([crud.name, 'min', 'js'].join('.')))
        .pipe(gulpUglify())
        .pipe(gulp.dest(paths.dest))
});

gulp.task('build:views', function () {
    gulp.src(path.join(paths.src, 'html/crud.html'))
        .pipe(gulp.dest(paths.dest));
});

gulp.task('build', ['clean', 'build:scripts', 'build:views']);

gulp.task('default', ['build'], function () {

    console.log(settings);

    //gulp.start('build');

    //gulpWatch(path.join(paths.src, crud.path, '**/*.js'), function (event) {
    //    console.log(event);
    //});

    //gulp.watch(path.join(paths.src, crud.path, '**/*.js'), ['build:js']);
});