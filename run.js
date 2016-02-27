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

import type {Config} from "./src/types";

let configFile = "./codegen.yaml";
if (process.argv.length > 2) {
    configFile = process.argv[2];
}

if (!fs.existsSync(configFile)) {
    console.log(`\
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

    const modules = getFlowTypes(entry.source);
    const configTypes = config.types || {};
    const files = generateSwiftFiles(name, entry.source, modules, configTypes);
    Object.keys(files).map(filename => {
        const dest = path.join(entry.dest, filename);
        mkdirp.sync(path.dirname(dest));
        fs.writeFileSync(dest, files[filename], "utf8");
    });
});

console.log("done!");
