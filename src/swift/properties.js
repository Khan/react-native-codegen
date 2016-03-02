/**
 * Generate the `public var x: type { didSet ... }` for the "ViewController".
 *
 * When a client sets `thething.currentVideo = aVideo`, we pass the new value
 * to the propsManager for serialization.
 *
 * @flow
 */

import {asSwiftTypeSignature} from "./signatures";
import {indentedLines, capitalize} from "./utils";

import type {
    Modules,
    Annotation,
    ConfigTypes,
    ObjectAnnotation,
} from "../types";


const makeProperty = (
    name: string,
    annotation: Annotation,
    config: ConfigTypes
): string => {
    const capName = capitalize(name);
    const type = asSwiftTypeSignature(annotation, config);
    // functions can't be compared in swift, so we skip the == check
    if (annotation.type === "function") {
        return `public var ${name}: ${type} {
  didSet {
    propsManager.set${capName}(${name})
  }
}`;
    } else {
        return `public var ${name}: ${type} {
  didSet {
    if ${name} != oldValue {
      propsManager.set${capName}(${name})
    }
  }
}`;
    }
};


export default (
    props: ObjectAnnotation,
    modules: Modules,
    config: ConfigTypes
): string => indentedLines(props.keys.map(
    key => makeProperty(key, props.attrs[key], config)
), "\n\n");
