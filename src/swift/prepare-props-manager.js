/**
 * Prepare the bulk of the logic for the PropsManager.
 *
 * @flow
 */

import {swiftValueToJson} from "./json-swift";
import {asSwiftTypeSignature} from "./signatures";
import {indentedLines, listValues, capitalize} from "./utils";

import type {
    ObjectAnnotation,
    Modules,
    ConfigTypes,
} from "../types";
import type {MarshallingMethods} from "./types";


export default (
    props: ObjectAnnotation,
    modules: Modules,
    config: ConfigTypes
): {
    // a series of methods like `func setThing(thing)` which serializes the
    // argument and stores it in the `serialized` Dictionary
    setters: string,
    // for value types that get passed back from JS (via a callback), we
    // generate a `deserializeThing` method
    deserializeMethods: string,
    // for value types that are passed to JS, we generate a `serializeThing`
    // method
    serializeMethods: string,
} => {
    const keys = props.keys;
    const marshallingMethods: MarshallingMethods = {
        serialize: {},
        deserialize: {},
    };
    const setters = indentedLines(keys.map(key => {
        const swiftType = asSwiftTypeSignature(props.attrs[key], config);
        const toJson = indentedLines([swiftValueToJson(
            key, props.attrs[key], marshallingMethods, modules, config
        )]);
        const capName = capitalize(key);
        return `private func set${capName}(${key}: ${swiftType}) {
  serialized["${key}"] = ${toJson}
}`;
    }), "\n\n");

    let deserializeMethods = indentedLines(
        listValues(marshallingMethods.deserialize), "\n\n");
    let serializeMethods = indentedLines(
        listValues(marshallingMethods.serialize), "\n\n");
    if (deserializeMethods) {
        deserializeMethods = "\n\n  " + deserializeMethods;
    }
    if (serializeMethods) {
        serializeMethods = "\n\n  " + serializeMethods;
    }

    return {setters, deserializeMethods, serializeMethods};
};
