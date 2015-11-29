'use strict';
import fs from 'fs';
import gulp from 'gulp';
import del from 'del';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();

const paths = {
  src: 'src/',
  dest: 'build/'
}

var reload = browserSync.reload;

var src = {
  templates: paths.src + 'templates/',
  scripts: paths.src + "scripts/",
  data: paths.src + 'data/',
  styles: paths.src + "styles/",
  images: paths.src + "img/",
  html: paths.src
}

var dest = {
  scripts: paths.dest,
  styles: paths.dest,
  images: paths.dest + "img/",
  html: paths.dest
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

gulp.task('handlebars', () => {
  var data = JSON.parse(
    fs.readFileSync(src.data + "/data.json"));
    
  var options = {
    batch : [src.templates],
  }
  
  return gulp.src(src.html + '/*.handlebars')
    .pipe($.compileHandlebars(data, options))
    .pipe($.rename((path) => {
      path.extname = ".html"
    }))
});

gulp.task('html', ['handlebars'], () => {
  return gulp.src(src.html + '**/*.html')
    .pipe($.minifyHtml())
    .pipe($.size({ title: 'html' }))
    .pipe(gulp.dest(dest.html))
});

gulp.task('scripts', ['lint'], () => {
  return gulp.src(src.scripts)
    .pipe($.sourcemaps.init())
      .pipe($.babel())
    .pipe($.sourcemaps.write())
      .pipe($.concat('main.min.js'))
      .pipe($.uglify())
      .pipe($.size({ title: 'scripts' }))
    .pipe($.sourcemaps.write())
    .pipe($.size({ title: 'scripts' }))
    .pipe($.rev())
    .pipe(gulp.dest(dest.scripts));
});

gulp.task('styles', () => {
  return gulp.src([
      src.styles + "**/*.sass",
      src.styles + "**/*.css"
    ])
    .pipe($.sourcemaps.init())
      .pipe($.sass()).on('error', $.sass.logError)
      .pipe($.autoprefixer({
        browsers: ['last 2 versions']
      }))
      .pipe($.minifyCss())
      .pipe($.uncss({
        html: ['**/*.html']
      }))
      .pipe($.concat('main.styles.css'))
    .pipe($.sourcemaps.write())
    .pipe($.size({ title: 'styles' }))
    .pipe($.rev())
    .pipe(gulp.dest(dest.styles))
    .pipe(browserSync.stream())
});

gulp.task('images', () => {
  return gulp.src(src.images + '**/*')
    .pipe($.cache($.imagemin({
      optimisationLevel: 5,
      progressive: true,
      interlaced: true
    })))
    .pipe($.size({ title: 'images' }))
    .pipe($.rev())
    .pipe(gulp.dest(dest.images))
    .pipe(browserSync.stream())
});

gulp.task('watch', () => {
  browserSync({
    notify: false,
    logPrefix: 'IDC',
    scrollElementMapping: ['main', '.mdl-layout'],
    server: ['build'],
    port: 3000
  });

  gulp.watch(src.html + '**/*.html', ['html', reload]);
  gulp.watch(src.scripts + '**/*.js', ['scripts', reload]);
  gulp.watch([src.styles + '**/*.(sass|css)'], ['styles']);
  gulp.watch(src.images + '**/*', ['images']);
});

gulp.task('default', ['clean', 'html', 'scripts', 'styles', 'images', 'watch']);