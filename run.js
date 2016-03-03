/**
 * run.js
 *
 * This is the main cli executable. It will generate the js + native bindings
 * files for the React Native root views specified in the config file.
 *
 * @flow
 */
/* eslint no-console: 0 */

import mkdirp from "mkdirp";
import yaml from "js-yaml";
import path from "path";
import fs from "fs";

import getFlowTypes from "./src/flow";
import generateSwiftFiles from "./src/swift";
import generateJSWrapper from "./src/js";

import type {Config} from "./src/types";

let configFile = "./codegen.yaml";
if (process.argv.length > 2) {
    configFile = process.argv[2];
}

const baseDir = path.dirname(configFile);

if (!fs.existsSync(configFile)) {
    console.error(`\
Usage:
  codegen [configfile]

Options:
  configfile: defaults to ./codegen.yaml
`);
    process.exit(1);
}

const config: Config = yaml.safeLoad(fs.readFileSync(configFile, "utf8"));

Object.keys(config.entries).forEach(name => {
    console.log(`Generating ${name}`);
    const entry = config.entries[name];

    const sourcePath = path.join(baseDir, entry.source);

    const modules = getFlowTypes(sourcePath);
    const configTypes = config.types || {};
    if (baseDir !== '.') {
        Object.keys(configTypes).forEach(name => {
            configTypes[path.join(baseDir, name)] = configTypes[name];
            delete configTypes[name];
        });
    }
    const files = generateSwiftFiles(name, sourcePath, modules, configTypes);
    Object.keys(files).map(filename => {
        const dest = path.join(path.join(baseDir, entry.dest), filename);
        mkdirp.sync(path.dirname(dest));
        fs.writeFileSync(dest, files[filename], "utf8");
    });
    const jsWrapperPath = path.join(path.dirname(sourcePath),
                                    name + "Wrapper.js");
    const jsWrapper = generateJSWrapper(
      name, sourcePath, modules, configTypes);
    fs.writeFileSync(jsWrapperPath, jsWrapper, "utf8");
});

console.log("done!");
