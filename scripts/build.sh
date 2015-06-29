#!/bin/sh

babel=node_modules/.bin/babel
webpack=node_modules/.bin/webpack
dist_dir=dist

# build minified standalone version in dist
rm -rf $dist_dir
NODE_ENV=production $webpack src/index.js
NODE_ENV=production COMPRESS=1 $webpack src/index.js

# build ES5 modules in modules
rm -rf modules
$babel ./src --out-dir ./modules

echo "gzipped, the global build is `gzip -c $dist_dir/koemei-search-results.min.js | wc -c | sed -e 's/^[[:space:]]*//'` bytes"
