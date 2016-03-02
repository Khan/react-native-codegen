/**
 * Generate a type signature string from a type annotation object.
 *
 * asSwiftTypeSignature is the signature for the deserialized value
 * asJsonTypeSignature is the signature for the serialized value
 *
 * @flow
 */

import type {Annotation, Modules, ConfigTypes} from "../types";

const SWIFT_BASES = {"string": "String", "number": "Int", "boolean": "Bool"};

export const asSwiftTypeSignature = (
    annotation: Annotation,
    config: ConfigTypes
): string => {
    switch (annotation.type) {
        case "type-ref":
            return config[annotation.path][annotation.name].swift;
        case "base":
            return SWIFT_BASES[annotation.name];
        case "void":
            return "Void";
        case "function":
            const params = annotation.params.map(
                param => param.name + ": " + asSwiftTypeSignature(param.ann,
                                                                config)
            ).join(", ");
            const returnType = asSwiftTypeSignature(annotation.returnType,
                                                    config);
            return `(${params}) -> ${returnType}`;
        case "optional":
            return asSwiftTypeSignature(annotation.inner, config) + "?";
    }
    throw new Error(`Unable to convert ${annotation} to swift signature`);
};

// This isn't really json, but swift types that react native knows how to
// serialize. Functions are replaced with integer ids.
export const asJsonTypeSignature = (
    annotation: Annotation,
    modules: Modules
): string => {
    switch (annotation.type) {
        case "base":
            return SWIFT_BASES[annotation.name];
        case "object":
            return "[String: AnyObject]";
        case "function":
            return "Int";
        case "optional":
            return asJsonTypeSignature(annotation.inner, modules) + "?";
        case "type-ref":
            return asJsonTypeSignature(
                modules[annotation.path][annotation.name], modules);
        case "union":
            return asJsonTypeSignature(annotation.options[0], modules);
    }
    throw new Error(`Unable to convert ${annotation} to json signature`);
};
