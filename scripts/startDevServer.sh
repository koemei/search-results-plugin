#!/bin/bash

webpackDevServer=node_modules/.bin/webpack-dev-server

rm -rf .examples/__build__
$webpackDevServer --config "$PWD/webpack.dev.config.js" --hot --content-base . --port 8000
