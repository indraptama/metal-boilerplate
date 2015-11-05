var gulp = require('gulp');
var postcss = require('gulp-postcss');
//var uncss = require('gulp-uncss');
var jade = require('gulp-jade');
var rename = require('gulp-rename');
var browserSync = require('browser-sync');
var reload = browserSync.reload;








// POSTCSS PLUGINS
// Future CSS and Autoprefixer
var cssnext = require('cssnext');
var rucksack = require('rucksack-css');
// Helper
//var vrhytem = require('postcss-vertical-rhythm');
var mdscale = require('postcss-modular-scale');
// Optimalization
var cssimport = require('postcss-import');
var hexa = require('postcss-color-alpha');
var mqpacker = require('css-mqpacker');
var cssfocus = require('postcss-focus');
//linter
var bemlinter = require('postcss-bem-linter');
var cssreport = require('postcss-reporter');
// Minifiy
var cssnano = require('cssnano');


//Browserify
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var babelify = require('babelify');
var notify = require('gulp-notify');


// Blog Builder
var Metalsmith = require('metalsmith');
var gulpsmith = require ('gulpsmith');
var collections = require ('metalsmith-collections');
var markdown = require ('metalsmith-markdownit');
var permalinks = require ('metalsmith-permalinks');
var layout = require ('metalsmith-layouts');
var inPlace = require ('metalsmith-in-place');
var gulp_front_matter = require('gulp-front-matter');
var assign = require('lodash.assign');
var excerpts = require('metalsmith-excerpts');



// setup path
var paths = {
  cssRoot: './public/stylesheets/index.css',
  cssPath: './public/stylesheets/**/*.css',
  jsRoot: './public/js/app.js',
  jsPath: './public/js/**/*.js',
  templates: './views/',
  template: './views/**/*',
  blogPath: './src/**/*.md'
};

// Main GULP TASK

// Development
gulp.task('default',['css','browserify','watchify','metalsmith','browser-sync'], function(){
  gulp.watch(paths.cssRoot,['css']);
  gulp.watch(paths.cssPath,['css']);
  gulp.watch(paths.blogPath,['metalsmith']);
  gulp.watch(paths.templates,['metalsmith']);
  gulp.watch(paths.template,['metalsmith']);
});

// Build
gulp.task('build',['css','uncss'], function(){
  //gulp.watch('./index.css',['css']);
});




// CSS DEVELOPMENT
gulp.task('css', function(){
  // define process
  var process = [
    //bemlinter(),
    //cssreport(),
    cssimport(),
    //vrhytem(),
    //mdscale(),
    hexa(),
    cssfocus(),
    rucksack(),
    cssnext(),
    mqpacker()
  ];

  // build
  return gulp.src(paths.cssRoot) //root of css file
  .pipe(postcss(process))
  .pipe(gulp.dest('./build/public/stylesheets/'))
  .pipe(reload({stream: true}));
});


// UNCSS TASK
gulp.task('uncss', function(){
  return gulp.src('./build/public/index.css')
    .pipe(uncss({
      html:['./build/index.html','./build/*.html','./build/**/*.html']
    }))
    .pipe(rename(function(path){
      paths.basename += '.min';
    }))
    .pipe(postcss([
      cssnano()
    ]))
    .pipe(gulp.dest('./build/'));
});


// Browserify
gulp.task('browserify', function() {
    return browserify({
        debug: true,
        entries: [paths.jsRoot],
        transform: [babelify]
    })
        .bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./build/public/js'));
});


// Watchify
gulp.task('watchify', function() {
    var bundler = watchify(browserify(paths.jsRoot, watchify.args));

    function rebundle() {
        return bundler
            .bundle()
            .on('error', notify.onError())
            .pipe(source('app.js'))
            .pipe(gulp.dest('./build/'))
            .pipe(reload({stream: true}));
    }

    bundler.transform(babelify)
        .on('update', rebundle);
    return rebundle();
});


// Function Browser-sync reload
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: './build/'
        }
    });
});

// Function Blog Builder

gulp.task('metalsmith', function() {
  return gulp.src(paths.blogPath)
    //.pipe(plumber())
    //.pipe(newer('./src/content/**/*'))
    .pipe(gulp_front_matter()).on("data", function(file) {
      assign(file, file.frontMatter);
      delete file.frontMatter;
    })
    .pipe(
      gulpsmith()
        .metadata({
          siteName: "My Site",
          localUrl: "http://localhost:3000"
        })
        .use(collections({
          publish: {
            pattern: '*/**/*.md',
            sortBy: 'date',
            reverse: true
          }
        }))
        .use(markdown({
          'typographer': true,
          'html': true
        }))
        .use(excerpts())
        .use(permalinks({
          pattern: ':collection/:title',
          relative: false
        }))

        .use(layout({
          engine: 'jade',
          pretty: true,
          directory: paths.templates
        }))
      )
    .pipe(gulp.dest('./build'))
    .pipe(reload({stream:true}));
});
