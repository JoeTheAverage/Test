'use strict';

import gulp from 'gulp';
import del from 'del';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();

const paths = {
  src: '',
  dest: 'build/',
}

var src = {
  scripts: paths.src + "scripts/",
  styles: paths.src + "styles/",
  images: paths.src + "img/"
}

var dest = {
  scripts: paths.dest + "scripts/",
  styles: paths.dest + "styles/",
  images: paths.src + "img/",
}

gulp.task('clean', () => {
  return del([paths.dest]);
});

gulp.task('lint', () => {
  return gulp.src(src.scripts + '**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'));
});

gulp.task('html', () => {
  return gulp.src(paths.src + '**/*.html')
    .pipe($.minifyHtml())
    .pipe(gulp.dest(paths.dest));
});

gulp.task('scripts', ['lint', 'clean'], () => {
  return gulp.src(src.scripts)
    .pipe($.sourcemaps.init())
      .pipe($.babel())
    .pipe($.sourcemaps.write())
      .pipe($.concat('main.min.js'))
      .pipe($.uglify())
      .pipe($.size({title: 'scripts'}))
    .pipe($.sourcemaps.write())
    .pipe($.rev())
    .pipe(gulp.dest(dest.scripts));
});

gulp.task('styles', ['clean'], () => {
  return gulp.src([
      src.styles + "**/*.sass",
      src.styles + "**/*.css"
    ])
    .pipe($.sourcemaps.init())
      .pipe($.sass()).on('error', $.sass.logError)
      .pipe($.autoprefixer( {
        browsers: ['last 2 versions']
      }))
      .pipe($.minifyCss())
      .pipe($.uncss({
        html: ['**/*.html']
      }))
      .pipe($.concat('main.styles.css'))
      .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write())
    .pipe($.rev())
    .pipe(gulp.dest(dest.styles))
});

gulp.task('images', ['clean'], () => {
  return gulp.src(src.images + '**/*')
    .pipe($.cache($.imagemin({
        optimisationLevel: 5,
        progressive: true,
        interlaced: true
    })))
    .pipe($.rev())
    .pipe(gulp.dest(dest.images))
    .pipe($.size({title: 'images'}))
});

gulp.task('watch', () => {
  gulp.watch(src.scripts, ['scripts']);
  gulp.watch(src.styles, ['styles']);
  gulp.watch(src.images, ['images']);
});

gulp.task('default', ['scripts', 'styles', 'images', 'watch']);