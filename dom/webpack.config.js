const path = require('path');

module.exports = {
  mode: 'development', // production development
  devtool: 'source-map', // 'inline-source-map', 'source-map' 单步跟踪调试时需要
  // devServer: {
  //   port: 8080, // 控制端口
  //   contentBase: './dist',
  // },
  watch: true, // 监控js 文件变化，变化后自动再次触发编译，以增量方式生成，速度快
  watchOptions: {
    // poll: 1000, // 每秒检查一次
    aggregateTimeout: 600, // 防抖，多少毫秒后再次触发
    ignored: ['test/**/*.js', 'node_modules/**'], // 忽略时监文件
  },
  profile: true,
  cache: true,
  // entry: {index: './src/index.js'}, // gulp中定义
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist'),
    publicPath: 'https://cos.wia.pub',
  },
  resolve: {
    // options for resolving module requests
    // (does not apply to resolving to loaders)
    modules: [
      'node_modules',
      path.resolve(__dirname, '.')
    ],
    // directories where to look for modules
    extensions: ['.js', '.ts']
    // extensions that are used
  },
  module: {
    rules: [{
      test: /\.(ts|js)$/,
      use: 'ts-loader',
      exclude: [/node_modules/]
    }]
  }
};
