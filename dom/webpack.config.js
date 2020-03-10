const path = require('path');

module.exports = {
  mode: 'development', // production development
  devtool: 'source-map', // 'inline-source-map', 'source-map' �������ٵ���ʱ��Ҫ
  // devServer: {
  //   port: 8080, // ���ƶ˿�
  //   contentBase: './dist',
  // },
  watch: true, // ���js �ļ��仯���仯���Զ��ٴδ������룬��������ʽ���ɣ��ٶȿ�
  watchOptions: {
    // poll: 1000, // ÿ����һ��
    aggregateTimeout: 600, // ���������ٺ�����ٴδ���
    ignored: ['test/**/*.js', 'node_modules/**'], // ����ʱ���ļ�
  },
  profile: true,
  cache: true,
  // entry: {index: './src/index.js'}, // gulp�ж���
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
