'use strict';
import fs from 'fs';
import gulp from 'gulp';
import del from 'del';
import merge from 'deepmerge';
import glob from 'glob';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import minimist from 'minimist';
import cleanUrls from 'clean-urls';

const $ = gulpLoadPlugins();

const paths = {
  src: 'src/',
  dest: '.build/'
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

var argv = minimist(process.argv.slice(2));

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
  var context = {}
  var files = glob.sync(src.data + "**/*.json");

  for (let file of files) {
    let data = JSON.parse(fs.readFileSync(file));
    context = merge(data, context);
  }

  var options = {
    batch: [src.templates],
  }

  return gulp.src(src.html + '**/*.html')
    .pipe($.compileHandlebars(context, options))
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
    .pipe(gulp.dest(dest.scripts));
});

gulp.task('styles', () => {
  return gulp.src([
    src.styles + "**/*.scss",
    src.styles + "**/*.css"
  ])
    .pipe($.sourcemaps.init())
    .pipe($.sass()).on('error', $.sass.logError)
    .pipe($.autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe($.minifyCss())
    .pipe($.uncss({
      html: [src.html + '**/*.html']
    }))
    .pipe($.concat('main.css'))
    .pipe($.sourcemaps.write())
    .pipe($.size({ title: 'styles' }))
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
    .pipe(gulp.dest(dest.images))
    .pipe(browserSync.stream())
});

gulp.task('watch', () => {
  browserSync({
    open: false,
    notify: false,
    logPrefix: 'BSYN',
    scrollElementMapping: ['main', '.mdl-layout'],
    server: {
      baseDir: paths.dest,
      middleware: cleanUrls(true, {
        root: './.build'
      })
    },
    port: 4000
  });

  gulp.watch(src.html + '**/*.html', ['html', reload]);
  gulp.watch(src.scripts + '**/*.js', ['scripts', reload]);
  gulp.watch(src.styles + '**/*.+(css|scss)', ['styles']);
  gulp.watch(src.images + '**/*', ['images']);
});

gulp.task('publish', ['default'], () => {
  return gulp.src('./.build/*')
    .pipe($.ghPages({
      branch: 'gh-pages',
      message: argv.m
    }))
})

gulp.task('default', ['clean', 'html', 'scripts', 'styles', 'images', 'watch']);