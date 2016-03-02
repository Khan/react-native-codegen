/**
 * Shared type definitions.
 *
 * @flow
 */

export type ObjectAnnotation = {
    type: "object",
    keys: Array<string>,
    attrs: {
        [key: string]: Annotation,
    },
};

export type TypeRefAnnotation = {
    type: "type-ref",
    path: string,
    name: string,
    params: Array<Annotation>
};

export type Annotation = ObjectAnnotation | TypeRefAnnotation | {
    type: "optional",
    inner: Annotation,
} | {
    type: "string-literal",
    value: string,
} | {
    type: "number-literal",
    value: number,
} | {
    type: "boolean-literal",
    value: boolean,
} | {
    type: "union",
    options: Array<Annotation>,
} | {
    type: "function",
    params: Array<{name: string, ann: Annotation}>,
    returnType: Annotation,
} | {
    type: "void",
} | {
    type: "base",
    name: string,
};

export type Modules = {
    [path: string]: {
        [typeName: string]: Annotation,
    },
};

export type ConfigTypes = {
    [path: string]: {
        [className: string]: {
            swift: string,
            java: string,
        },
    },
};

export type Config = {
    entries: {
        [className: string]: {
            source: string,
            dest: string,
        },
    },
    types: ConfigTypes,
};
