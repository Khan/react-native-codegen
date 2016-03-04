/**
 * Generate a type signature string from a type annotation object.
 *
 * asJavaTypeSignature is the signature for the deserialized value
 * asJsonTypeSignature is the signature for the serialized value
 *
 * @flow
 */

import type {Annotation, Modules, ConfigTypes} from "../types";

// TODO(jared): use comments to distinguish between floats and ints (default
// to integer, have a comment like `// codegen: float` for floats)
const BASE_JAVA_TYPE_NAME_MAPPING = {
    string: "String",
    number: "int",
    boolean: "boolean",
};
const BASE_JAVA_FN_TYPE_NAME_MAPPING = {
    string: "String",
    number: "Integer",
    boolean: "Boolean",
};

export const asJavaTypeSignature = (
    annotation: Annotation,
    inGeneric: boolean,
    config: ConfigTypes
): string => {
    switch (annotation.type) {
        case "type-ref":
            return config[annotation.path][annotation.name].java;
        case "base":
            if (inGeneric) {
                return BASE_JAVA_FN_TYPE_NAME_MAPPING[annotation.name];
            } else {
                return BASE_JAVA_TYPE_NAME_MAPPING[annotation.name];
            }
        case "void":
            return "void";
        case "function":
            const params = annotation.params.map(param => {
              const javaType = asJavaTypeSignature(param.ann, true, config);
              return `${javaType}`
            }).join(", ");
            if (annotation.returnType.type !== "void") {
                throw new Error("Functions must have void return type");
            }
            if (params.length == 0) {
                return `Fn0args`;
            }
            if (params.length == 1) {
                return `Fn1arg<${params}>`;
            }
            return `Fn${annotation.params.length}args<${params}>`;
        case "optional":
            return "Optional<" + asJavaTypeSignature(annotation.inner, true, config) + ">";
    }
    throw new Error(`Unable to convert ${JSON.stringify(annotation)} to java signature`);
};

// This isn't really json, but swift types that react native knows how to
// serialize. Functions are replaced with integer ids.
export const asJsonTypeSignature = (
    annotation: Annotation,
    modules: Modules
): string => {
    switch (annotation.type) {
        case "base":
            return BASE_JAVA_TYPE_NAME_MAPPING[annotation.name];
        case "object":
            return "Bundle";
        case "function":
            return "Int";
        case "optional":
            // TODO nullable?
            return asJsonTypeSignature(annotation.inner, modules);
        case "type-ref":
            return asJsonTypeSignature(
                modules[annotation.path][annotation.name], modules);
        case "union":
            return asJsonTypeSignature(annotation.options[0], modules);
    }
    throw new Error(`Unable to convert ${JSON.stringify(annotation)} to json signature`);
};

