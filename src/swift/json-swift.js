/**
 * Generate the swift code for serializing & deserializing values.
 *
 * swiftValueToJson generates serialization code
 * jsonValueToSwift generates deserialization code
 *
 * For value types (objects), serialization/deserialization is delegated to
 * dedicated methods, which allow for less duplicated code and also supports
 * recursive types. These dedicated methods are stored in
 * `MarshallingMethods`, and are generated only if needed (e.g. if there's a
 * type that never gets passed back from the javascript side, we don't need a
 * deseralization method).
 *
 * @flow
 */

import {asSwiftTypeSignature, asJsonTypeSignature} from "./signatures";
import {indentedLines} from "./utils";

import type {
    Modules,
    Annotation,
    ConfigTypes,
    TypeRefAnnotation,
} from "../types";
import type {MarshallingMethods} from "./types";


const makeSerializeFn = (
    annotation: TypeRefAnnotation,
    marshallingMethods: MarshallingMethods,
    modules: Modules,
    config: ConfigTypes
): string => {
    const swiftName = config[annotation.path][annotation.name].swift;
    const realType = modules[annotation.path][annotation.name];

    let body = "";
    let result = "";

    if (realType.type === "object") {
        const keys = realType.keys;
        body = indentedLines(
            realType.keys.map(key => {
                const type = asJsonTypeSignature(realType.attrs[key], modules);
                const toJson = swiftValueToJson(
                  "val." + key,
                  realType.attrs[key],
                  marshallingMethods,
                  modules,
                  config
                );
                return `let ${key}: ${type} = ${toJson}`;
            })
        );
        result = "[" + keys.map(key => `"${key}": ${key}`).join(", ") + "]";
    } else {
        throw new Error("Can't current encode non-object types");
    }

    const jsonType = asJsonTypeSignature(realType, modules);
    return `func serialize${swiftName}(val: ${swiftName}) -> ${jsonType} {
  ${body}
  return ${result}
}`;
};


const makeDeserializeFn = (
    annotation: TypeRefAnnotation,
    marshallingMethods: MarshallingMethods,
    modules: Modules,
    config: ConfigTypes
): string => {
    const swiftName = config[annotation.path][annotation.name].swift;
    const realType = modules[annotation.path][annotation.name];

    let body = "";
    let result = "";

    if (realType.type === "object") {
        const keys = realType.keys;
        body = indentedLines(
            realType.keys.map(key => {
                const type = asSwiftTypeSignature(realType.attrs[key], config);
                const toSwift = jsonValueToSwift(
                    `val["${key}"]!`,
                    realType.attrs[key],
                    marshallingMethods,
                    modules,
                    config
                );
                return `let ${key}: ${type} = ${toSwift}`;
            })
        );
        result = swiftName + "(" +
            keys.map(key => `${key}: ${key}`).join(", ") + ")";
    } else {
        throw new Error("Can't currently encode non-object types");
    }

    const jsonType = asJsonTypeSignature(realType, modules);
    return `func deserialize${swiftName}(val: ${jsonType}) -> ${swiftName} {
  ${body}
  return ${result}
}`;
};


export const jsonValueToSwift = (
    argname: string,
    annotation: Annotation,
    marshallingMethods: MarshallingMethods,
    modules: Modules,
    config: ConfigTypes
): string => {
    switch (annotation.type) {
        case "type-ref":
            const swiftName = config[annotation.path][annotation.name].swift;
            const realType = modules[annotation.path][annotation.name];
            if (marshallingMethods.deserialize[swiftName] === undefined) {
                // set placeholder to protect against recursion
                marshallingMethods.deserialize[swiftName] = "";
                marshallingMethods.deserialize[swiftName] = makeDeserializeFn(
                    annotation, marshallingMethods, modules, config);
            }
            const jsonType = asJsonTypeSignature(realType, modules);
            return `self.deserialize${swiftName}(${argname} as! ${jsonType})`;
        case "base":
            return argname + " as! " + asSwiftTypeSignature(annotation, config);
        case "void":
            throw new Error("Unable to convert a void value");
        case "optional":
            if (annotation.inner.type === "base") {
                const jsonToSwift = jsonValueToSwift(
                    argname,
                    annotation.inner,
                    marshallingMethods,
                    modules,
                    config
                );
                return `{
  if ${argname} is NSNull {
    return .None
  } else {
    return ${jsonToSwift}
  }
}()`;
            }
            throw new Error("Unable to convert non-base optional types");
        case "function":
            const args = annotation.params.map(
                param => param.name + ": " + asSwiftTypeSignature(param.ann,
                                                                config)
            ).join(", ");
            const jsonArgs = annotation.params.map(
                param => `"${param.name}": ${param.name}_json`).join(", ");
            const body = indentedLines(
            annotation.params.map(param => {
                const jsonType = asJsonTypeSignature(param.ann, modules);
                const swiftToJson = swiftValueToJson(
                    param.name, param.ann, marshallingMethods, modules, config);
                return `let ${param.name}_json: ${jsonType} = ${swiftToJson}`;
            })
        );
            return `{(${args}) in
  ${body}
  ReactNativeBridge.sharedInst.callJS(${argname} as! Int, args: [${jsonArgs}])
}`;
    }
    throw new Error(`Cannot convert ${annotation} into swift`);
};


export const swiftValueToJson = (
    argname: string,
    annotation: Annotation,
    marshallingMethods: MarshallingMethods,
    modules: Modules,
    config: ConfigTypes
): string => {
    switch (annotation.type) {
        case "type-ref":
            const swiftName = config[annotation.path][annotation.name].swift;
            if (marshallingMethods.serialize[swiftName] === undefined) {
                // set placeholder to protect against recursion
                marshallingMethods.serialize[swiftName] = "";
                marshallingMethods.serialize[swiftName] = makeSerializeFn(
                    annotation, marshallingMethods, modules, config);
            }
            return `self.serialize${swiftName}(${argname})`;
        case "base":
            return argname;
        case "void":
            throw new Error("Cannot convert Void to JSON");
        case "function":
            let setup = indentedLines(annotation.params.map(param => {
                const swiftType = asSwiftTypeSignature(param.ann, config);
                const toSwift = jsonValueToSwift(
                    `args["${param.name}"]!`,
                    param.ann,
                    marshallingMethods,
                    modules,
                    config
                );
                return `let ${param.name}: ${swiftType} = ${toSwift}`;
            }));
            if (setup) {
                setup += "\n  ";
            }
            const args = annotation.params.map(
                param => `${param.name}: ${param.name}`).join(", ");
            return `registerCallback({args in
  ${setup}${argname}(${args})
})`;
        case "optional":
            if (annotation.inner.type === "base") {
                return argname;
            }
            const toJson = swiftValueToJson(
                "val", annotation.inner, marshallingMethods, modules, config);
            return `{
  switch ${argname} {
    case .Some(val):
      return ${toJson}
    csae .None:
      return nil
  }
}()`;
    }
    throw new Error(`Can't convert ${annotation} to JSON`);
};
