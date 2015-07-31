var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var isCompressed = process.env.COMPRESS === '1';
var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }),
  new ExtractTextPlugin(isCompressed ? 'style.min.css' : 'style.css')
];

if (isCompressed) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  );
}

module.exports = {
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: isCompressed ? 'koemei-search-results.min.js' : 'koemei-search-results.js',
    library: 'KoemeiSearchResults',
    libraryTarget: 'umd'
  },

  externals: {
    'jquery': {
      root: 'jQuery',
      commonjs: 'jquery',
      commonjs2: 'jquery',
      amd: 'jquery'
    }
  },

  module: {
    loaders: [{
      test: /\.json$/,
      loader: 'json'
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('css-loader')
    }]
  },

  plugins: plugins

};
