const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/setup.ts',
  experiments: {
    outputModule: true
  },
  optimization: {
    minimize: false,
    usedExports: true,
    concatenateModules: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
    generator: {
      'asset/resource': {
        publicPath: 'img/',
        outputPath: 'img/',
        filename: '[name][ext]',
      },
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'setup.mjs',
    path: path.resolve(__dirname, 'packed'),
    module: true,
    library: {
      type: 'module',
    },
    clean: true,
  },
};