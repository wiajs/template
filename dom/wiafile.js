/* eslint-disable import/no-extraneous-dependencies */

/**
 * Created by way on 2019/3/12.
 */
const gulp = require('gulp');
const opn = require('opn');
const connect = require('gulp-connect');

const _ = require('lodash');

// ����gulp���ݲ���
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
const _mapDelay = 10; // �ӳ�10�룬ִ��Դ�����ļ�ɨ��

// process.env.NODE_ENV ϵͳ����
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

// ȥ��ҳ��ո񣬿���ҳ�浽ָ��Ŀ¼
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
 * less ת��Ϊ css
 * @param {*} les less����
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

// js �첽�����webpack�� watch ���ܣ����Զ�����Ŀ���ļ������ļ��޸Ļ��Զ����´��
async function js(cb) {
  const ps = await wiapages();

  const cfg = _.merge(wpCfg, {
    // �滻 webpack.config.js �������
    // mode: 'production', //options.env,
    entry: {
      index: `${src}/index.js`,
      // [`${prj}/app.min`]: src + 'app.js'
    }, // dist/ebx/app.min.js
  });
  // console.log('webpack config:', cfg);
  _wping = webpack(cfg).watch(
    {
      aggregateTimeout: 600, // �ӳٺ���
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
    // ͳһת���� doc Ŀ¼
    .pipe(gulp.dest(dst + 'doc/'));
    
  cb();
}

// ����web�������ڱ��ص���
// http://127.0.0.1:3003/
function web(cb) {
  connect.server({
    name: 'web',
    root: `${dst}`, // web�����Ŀ¼
    port: 3003, // �˿�
    livereload: true,
  });
  opn('http://localhost:3003/');
  cb();
}

// ����ļ��仯���仯�����Զ�ˢ�±��������
function reload(cb) {
  gulp.watch([`${dst}/**/*.html`, `${dst}/**/*.css`, `${dst}/**/*.js`], () =>
    connect.reload()
  );
  cb();
}

/**
 * �ļ��仯��������
 * @param {*} delay �ӳٶ�����ִ�У��������������ļ��Ķ�Ƶ��ִ��
 * @param {*} cb
 */
function watch(cb) {
  const dir = process.cwd();
  let cbs = 0;
  function onCb() {
    cbs += 1;
    // ���һ�λص�
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

exports.pages = pages; // wia pages ִ�У�
exports.watch = watch; // gulp f7css ִ�У�
exports.css = css; // gulp css ִ�У�
exports.f7 = f7; // gulp f7css ִ�У�
// ����html�ļ������ļ����޸ģ��Զ�����������
// js �ļ��� webpack�Լ��ļ�ر��룬����
exports.html = html; // html ̫���ˣ��ɵ��� ʹ�� gulp html ִ�У�
// ȱʡ����gulp �������ƣ�������������ʱ��ִ�и�����
// gulp.task('default', gulp.parallel('watch', 'js', 'css', 'html', 'md', 'web', 'reload'));
exports.default = gulp.parallel(web, reload, html, f7, js, () => {
  // exports.default = () => {
  // js �� webpack watch ����
  // pageĿ¼������ɾ���仯���Զ��޸� src/pages.js�ļ������� webpack js ���±���
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
    {queue: false, ignoreInitial: false}, // ���Ŷӣ��״�����
    watch
  );
  // f7���ñ仯���Զ��޸� src/app.js�ļ������� webpack js ���±���
  gulp.watch('./src/f7.config.js', {delay: 600}, f7);
});
