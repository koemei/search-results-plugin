var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {

  entry: [
    path.join(__dirname, 'main.js'),
    'webpack-dev-server/client?http://localhost:8000'
  ],
    output: {
    path: 'examples/__build__/',
    filename: 'koemei-search-results.js',
    publicPath: '/__build__/'
  },

  module: {
    loaders: [{
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('css-loader')
    }]
  },

  resolve: {
    alias: {
      'KoemeiSearchResults': path.join(__dirname, '../src')
    }
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    new ExtractTextPlugin('style.css')
  ]
};
