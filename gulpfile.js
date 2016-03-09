var path = require('path'),
    gulp = require('gulp'),
    gulpIf = require('gulp-if'),
    gulpConcat = require('gulp-concat'),
    gulpUglify = require('gulp-uglify');

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

gulp.task('build:js', function () {
    gulp.src((function (mask, src) {
            return mask.map(function (pattern) {
                return path.join(paths.src, src, pattern);
            });
        })(crud.mask, crud.path))
        .pipe(gulpConcat([crud.name, 'min', 'js'].join('.')))
        //.pipe(gulpUglify())
        .pipe(gulp.dest(paths.dest))
});

gulp.task('build:html', function () {
    gulp.src(path.join(paths.src, 'html/crud.html'))
        .pipe(gulp.dest(paths.dest));
});

gulp.task('build', function () {
    gulp.start('build:js', 'build:html');
});

gulp.task('default', function () {
    gulp.start('build');
});