#!/usr/bin/env node
console.log('register');
require('babel-register')({
  "presets": ["react", "es2015", "stage-0"],
  ignore: /node_modules\/(?!react-native-codegen\/)/
});
require('./run');
