/**
 * This uses the `flow` cli tool to get a type-annotated AST of a given file
 * (and all imports) and produces a nested map of
 * {[path]: {[name]: type_definition}} (called `Modules`)
 *
 * @flow
 */

import path from "path";
import fs from "fs";
import {execSync} from "child_process";

import type {Modules, Annotation} from "./types";


// TODO(jared): (probably) annotate these fully
type ASTNode = Object;
type FlowAnnotation = Object;


const BASE_TYPES = {
    StringTypeAnnotation: "string",
    NumberTypeAnnotation: "number",
    BooleanTypeAnnotation: "boolean",
};


const getAst = (file: string): ASTNode => {
    // $FlowIgnore flow has a problem with execSync apparently...
    return JSON.parse(execSync("flow ast --pretty " + file));
};


const resolvePath = (file: string, curpath: string): ?string => {
    if (file[0] !== ".") {
        return;
    }
    file = path.normalize(path.join(path.dirname(curpath), file));
    if (!fs.existsSync(file)) {
        if (fs.existsSync(file + ".js")) {
            return file + ".js";
        }
        throw new Error(`Unable to find ${file}`);
    }
    const stat = fs.statSync(file);
    if (stat.isFile()) {
        return file;
    }
    if (stat.isDirectory()) {
        if (fs.existsSync(file + "/index.js")) {
            return file + "/index.js";
        }
    }
    throw new Error(`Unable to find ${file}`);
};


const parseType = (annotation: FlowAnnotation, curpath: string): Annotation => {
    switch (annotation.type) {
        case "ObjectTypeAnnotation":
            const attrs = {};
            annotation.properties.forEach(item => {
                attrs[item.key.name] = parseType(item.value, curpath);
            });
            return {
                type: "object",
                keys: annotation.properties.map(item => item.key.name),
                attrs,
            };
        case "GenericTypeAnnotation":
            return {
                type: "type-ref",
                path: curpath,
                name: annotation.id.name,
                params: (
                    annotation.params ?
                    annotation.params.map(sub => parseType(sub, curpath)) :
                    []
                ),
            };
        case "NullableTypeAnnotation":
            return {
                type: "optional",
                inner: parseType(annotation.typeAnnotation, curpath),
            };
        case "StringLiteralTypeAnnotation":
            return {
                type: "string-literal",
                value: annotation.value,
            };
        case "NumberLiteralTypeAnnotation":
            return {
                type: "number-literal",
                value: annotation.value,
            };
        case "BooleanLiteralTypeAnnotation":
            return {
                type: "boolean-literal",
                value: annotation.value,
            };
        case "UnionTypeAnnotation":
            return {
                type: "union",
                options: annotation.types.map(sub => parseType(sub, curpath)),
            };
        case "FunctionTypeAnnotation":
            return {
                type: "function",
                params: annotation.params.map(param => ({
                    name: param.name.name,
                    ann: parseType(param.typeAnnotation, curpath),
                })),
                returnType: parseType(annotation.returnType, curpath),
            };
        case "VoidTypeAnnotation":
            return {type: "void"};
        default:
            if (BASE_TYPES[annotation.type]) {
                return {
                    type: "base",
                    name: BASE_TYPES[annotation.type],
                };
            }
            throw new Error(`Unknown type: ${JSON.stringify(annotation)}`);
    }
};


const processPath = (file: string, modules: Modules) => {
    if (modules[file]) {
        return;
    }
    modules[file] = {};
    const ast = getAst(file);

    ast.body.forEach(item => {
        // import type ...
        if (item.type === "ImportDeclaration" && item.importKind === "type") {
            const subpath = resolvePath(item.source.value, file);
            if (!subpath) {
                return;
            }
            item.specifiers.forEach(spec => {
                const name = (spec.name || spec.id).name;
                modules[file][name] = {
                    type: "type-ref",
                    params: [],
                    path: subpath,
                    name: spec.id.name,
                };
            });
            processPath(subpath, modules);
        } else if (item.type === "TypeAlias") {
            modules[file][item.id.name] = parseType(item.right, file);
        } else if (item.type === "ExportDeclaration" &&
                   item.declaration.type === "TypeAlias") {
            modules[file][item.declaration.id.name] = parseType(
                item.declaration.right,
                file
            );
        } else if (item.type === "ClassDeclaration") {
            // TODO(jared): maybe keep track of declared classes?
        } else {
            // Ignore other top-level forms
        }
    });
};


export default (file: string): Modules => {
    const modules = {};
    processPath(file, modules);
    return modules;
};
