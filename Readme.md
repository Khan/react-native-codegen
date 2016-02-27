# React Native Code Generation

The purpose of this project is to ease the integration of React Native into
large production apps, so React Native adoption can happen incrementally, with
minimal friction.

ReactNativeCodeGen takes a [flowtype](https://flowtype.org) type definition of
the props a React Native component expects and generates java and swift code
to marshall the data, including functions and structs. The resulting class is
then usable within the context of a typical iOS or Android app.

## Status

Swift support is complete enough to be going on with, although some types are
not yet supported.

Java support has not yet begun.

## Usage

ReactNativeCodeGen uses a configuration file, typically called `codegen.yaml`.
See the `codegen.yaml` in this directory for an example. It defines both the
Root components that are to be processed as well as a mapping from `flowtype`
struct definitions to the swift/java equivalent.

`babel-node run.js my-config.yaml` will generate the files necessary to
bind.

### Config file format

```
entries:
  MyGreatRNView:
    source: "./path/to/main/file.js"
    dest: "./place/to/put/generated/files/"
  OtherRNView:
    ...

types:
  "./path/to/a/file/with/a/type/in/it.js":
    NameOfFlowType:
      swift: CorrespondingSwiftType
      java: com.example.CorrespondingJavaType
    ...
  ...
```

## Developing

You will need flow installed (`brew install flow`) and nodejs.

Run `npm install` and then `npm run example` to generate the example bridge
files, defined in `./codegen.yaml`.

## TODO

Swift
- Array<> types
- sum types

Java
- everything

