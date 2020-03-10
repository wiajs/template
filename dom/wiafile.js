/* eslint-disable import/no-extraneous-dependencies */

/**
 * Created by way on 2019/3/12.
 */
const gulp = require('gulp');
const opn = require('opn');
const connect = require('gulp-connect');

const _ = require('lodash');

// 用于gulp传递参数
const minimist = require('minimist');
const path = require('path');
const webpack = require('webpack');

const rename = require('gulp-rename');
const less = require('gulp-less');
const mincss = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const header = require('gulp-header');
const tap = require('gulp-tap');
// const pkg = require('./package.json');
const named = require('vinyl-named');
const gulpif = require('gulp-if');
const htmlmin = require('gulp-htmlmin');
const markdown = require('gulp-markdown');
const buildF7 = require('@wiajs/f7/f7');
const wiapages = require('@wiajs/core/util/pages');
const wiamap = require('@wiajs/core/util/wiamap');

const prj = 'etrip';
const src = './src';
const dst = './dist';
let _wping = null;
const _mapDelay = 10; // 延迟10秒，执行源代码文件扫描

// process.env.NODE_ENV 系统变量
const opts = {
  string: 'env',
  default: {env: process.env.NODE_ENV || 'dev'}, // development production
};

const options = minimist(process.argv.slice(2), opts);
const wpCfg = require('./webpack.config.js');

console.log({
  dst,
  src,
  'options.env': options.env,
  'process.env.NODE_ENV': process.env.NODE_ENV,
});

// 去掉页面空格，拷贝页面到指定目录
function html(cb) {
  gulp
    .src(`${src}/*.html`)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(dst));

  gulp
    .src(`${src}/page/*.html`)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(`${dst}/page`));

  cb();
}

function f7(cb) {
  buildF7(__dirname, prj, cb);
}

/**
 * less 转换为 css
 * @param {*} les less数组
 * @param {*} cb
 */
function css(les, cb) {
  if (_.isEmpty(les)) {
    cb();
    return;
  }

  const ls = les.map(v => `${src}/${v}`);
  console.log('css', {ls});
  gulp
    .src(ls, {base: './src'})
    .pipe(
      less({javascriptEnabled: true}).on('error', e => {
      console.error(e.message);
      this.emit('end');
      })
    )
    .pipe(autoprefixer())
    .pipe(gulp.dest(`${dst}`));
  // .pipe(mincss())
  // .pipe(rename({ suffix: '.min' }))
  // .pipe(gulp.dest(dst));

  cb();
}

async function updatePages(cb) {
  if (_wping) {
    _wping.close(() => {
      console.log('JS watching ended.');
    });
  }

  js(cb);
}

// js 异步打包，webpack的 watch 功能，会自动监视目标文件，有文件修改会自动重新打包
async function js(cb) {
  const ps = await wiapages();

  const cfg = _.merge(wpCfg, {
    // 替换 webpack.config.js 里的设置
    // mode: 'production', //options.env,
    entry: {
      index: `${src}/index.js`,
      // [`${prj}/app.min`]: src + 'app.js'
    }, // dist/ebx/app.min.js
  });
  // console.log('webpack config:', cfg);
  _wping = webpack(cfg).watch(
    {
      aggregateTimeout: 600, // 延迟毫秒
      ignored: ['test/**/*.js', 'node_modules/**'],
    },
      // webpack(cfg).run((err, stats) => {
    (err, stats) => {
      if (err) {
        console.error(err);
      } else {
        console.log(
          stats.toString({
            chunks: false, // Makes the build much quieter
            colors: true, // Shows colors in the console
          })
        );
      }
    }
  );

  cb();
}

function md(cb) {
  gulp
    .src([src + 'doc/**/*.md'])
    .pipe(markdown())
    // 统一转换到 doc 目录
    .pipe(gulp.dest(dst + 'doc/'));
    
  cb();
}

// 本地web服务，用于本地调试
// http://127.0.0.1:3003/
function web(cb) {
  connect.server({
    name: 'web',
    root: `${dst}`, // web服务根目录
    port: 3003, // 端口
    livereload: true,
  });
  opn('http://localhost:3003/');
  cb();
}

// 监控文件变化，变化了则自动刷新本地浏览器
function reload(cb) {
  gulp.watch([`${dst}/**/*.html`, `${dst}/**/*.css`, `${dst}/**/*.js`], () =>
    connect.reload()
  );
  cb();
}

/**
 * 文件变化触发编译
 * @param {*} delay 延迟多少秒执行，防抖动，避免文件改动频繁执行
 * @param {*} cb
 */
function watch(cb) {
  const dir = process.cwd();
  let cbs = 0;
  function onCb() {
    cbs += 1;
    // 最后一次回调
    if (cbs === 1) {
      wiamap.builded(dir, true);
      cb && cb();
    }
  }
  setTimeout(async () => {
    try {
      const rs = await wiamap.map(dir, 'build');
      console.log('wiamap:', {rs});

      css(rs.less, onCb);
    } catch (ex) {
      console.log('watch exp:', ex.message);
      wiamap.builded(dir, false);
      cb && cb();
    }
  }, _mapDelay * 1000);
}

async function pages(cb) {
  console.log('pages...');
  await wiapages(process.cwd());
  cb();
}

exports.pages = pages; // wia pages 执行！
exports.watch = watch; // gulp f7css 执行！
exports.css = css; // gulp css 执行！
exports.f7 = f7; // gulp f7css 执行！
// 监视html文件任务，文件被修改，自动触发该任务
// js 文件由 webpack自己的监控编译，更快
exports.html = html; // html 太多了，可单独 使用 gulp html 执行！
// 缺省任务，gulp 任务名称，不带任务名称时，执行该任务
// gulp.task('default', gulp.parallel('watch', 'js', 'css', 'html', 'md', 'web', 'reload'));
exports.default = gulp.parallel(web, reload, html, f7, js, () => {
  // exports.default = () => {
  // js 由 webpack watch 监视
  // page目录新增、删除变化，自动修改 src/pages.js文件，触发 webpack js 重新编译
  gulp.watch(
    ['./src/page/**/*.js'],
    {events: ['add', 'unlink'], delay: 600},
    pages
  );
  gulp.watch('./src/**/*.html', {delay: 600}, html);
  // gulp.watch('./src/**/*.less', {delay: 600}, css);
  gulp.watch(
    // ['./src/**/*.{html,less,js}', '!./src/f7.config.js', '!./src/page.bak/**'],
    ['./src/**/*.less', '!./src/page.bak/**'],
    {queue: false, ignoreInitial: false}, // 不排队，首次运行
    watch
  );
  // f7配置变化，自动修改 src/app.js文件，触发 webpack js 重新编译
  gulp.watch('./src/f7.config.js', {delay: 600}, f7);
});
