const { src, dest } = require('gulp');
const gulp = require('gulp');
const browsersync = require('browser-sync');
const fileinclude = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const groupmedia = require('gulp-group-css-media-queries');
const cleancss = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const webpcss = require('gulp-webp-css');
const svgsprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');

const projectFolder = require('path').basename(__dirname);
const sourceFolder = "src";

const fs = require('fs');

const path = {

  build: {
    html: projectFolder + "/",
    css: projectFolder + "/css/",
    js: projectFolder + "/js/",
    img: projectFolder + "/img/",
    fonts: projectFolder + "/fonts/"
  },

  src: {
    html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"],
    css: sourceFolder + "/scss/style.scss",
    js: sourceFolder + "/js/script.js",
    img: sourceFolder + "/img/**/*.{jpg, png, svg, gif, ico, webp}",
    fonts: sourceFolder + "/fonts/*.ttf"
  },

  watch: {
    html: sourceFolder + "/**/*.html",
    css: sourceFolder + "/scss/**/*.scss",
    js: sourceFolder + "/js/**/*.js",
    img: sourceFolder + "/img/**/*.{jpg, png, svg, gif, ico, webp}",
  },

  clean: "./" + projectFolder + "/"
}

browsersync.create();

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + projectFolder + "/"
    },
    port: 3000,
    notify: false
  })
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

function resetcss() {
  return src('src/scss/reset.scss')
    .pipe(cleancss())
    .pipe(
      rename({
        extname: ".min.css"
      })
    )
    .pipe(dest(path.build.css))
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: "expanded"
      })
    )
    .pipe(groupmedia())
    .pipe(
      autoprefixer({
        cascade: true
      })
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(cleancss())
    .pipe(
      rename({
        extname: ".min.css"
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(
      uglify()
    )
    .pipe(
      babel({
        presets: ["@babel/preset-env"]
      })
    )
    .pipe(
      rename({
        extname: ".min.js"
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false}],
        interlaced: true,
        optimizationLevel: 3
      })
    )  
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

function fonts(params) {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest((path.build.fonts)))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest((path.build.fonts)))
}

gulp.task('svgsprite', function() {
  return gulp.src([sourceFolder + '/iconsprite/*.svg'])
    .pipe(svgsprite({
      mode: {
        stack: {
          sprite: '../icons/icons.svg',
          example: true  // Create an HTML example document
        }
      }
    }))
    .pipe(dest(path.build.img))
})

gulp.task('otf2ttf', function() {
  return src([sourceFolder + '/fonts/*.otf'])
    .pipe(
      fonter({
        formats:['ttf']
      })
    )
    .pipe(dest(sourceFolder + '/fonts/'))
})

function fontsStyle(params) {
  let file_content = fs.readFileSync(sourceFolder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(sourceFolder + 'scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function(err, items) {
      if (items) {
        let c_fontname;
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function cb() {}

function watchFiles() {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

function clean(params) {
  return del(path.clean)
}

const build = gulp.series(clean, gulp.parallel(js, resetcss, css, html, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.resetcss = resetcss;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
