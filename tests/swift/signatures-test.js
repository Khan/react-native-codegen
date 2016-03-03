/**
 * Tests for swift type signature generation
 *
 * @flow
 */

import {
  asSwiftTypeSignature,
  asJsonTypeSignature,
} from "../../src/swift/signatures";

import expect from "expect";
import {describe, it} from "mocha";

import type {Annotation, Modules, ConfigTypes} from "../../src/types";

const config: ConfigTypes = {
    "index.js": {
        User: {
            swift: "SwiftUser",
            java: "",
        },
    },
};

const modules: Modules = {
    "index.js": {
        User: {
            type: "object",
            keys: ["name", "age"],
            attrs: {
                name: {
                    type: "base",
                    name: "string",
                },
                age: {
                    type: "base",
                    name: "string",
                },
                parent: {
                    type: "optional",
                    inner: {
                        type: "type-ref",
                        path: "index.js",
                        name: "User",
                        params: [],
                    },
                },
            },
        },
    },
};

type Fixtures = Array<{
    annotation: Annotation,
    swift: string,
    json?: string,
}>;

// If the "jsonish" signature is the same as the swift signature, it is
// omitted
const fixtures: Fixtures = [{
    name: "string",
    annotation: {type: "base", name: "string"},
    swift: "String",
}, {
    name: "number",
    annotation: {type: "base", name: "number"},
    swift: "Int",
}, {
    name: "boolean",
    annotation: {type: "base", name: "boolean"},
    swift: "Bool",
}, {
    name: "optional string",
    annotation: {type: "optional", inner: {type: "base", name: "string"}},
    swift: "String?",
}, {
    name: "type ref",
    annotation: {type: "type-ref", params: [], name: "User", path: "index.js"},
    swift: "SwiftUser",
    json: "[String: AnyObject]",
}, {
    name: "Simple function",
    annotation: {
        type: "function",
        params: [],
        returnType: {type: "void"},
    },
    swift: "() -> Void",
    json: "Int",
}, {
    name: "Complex function",
    annotation: {
        type: "function",
        params: [{
            name: "user",
            ann: {
                type: "type-ref",
                path: "index.js",
                name: "User",
                params: [],
            },
        }, {
            name: "count",
            ann: {
                type: "base",
                name: "number",
            },
        }],
        returnType: {type: "void"},
    },
    swift: "(user: SwiftUser, count: Int) -> Void",
    json: "Int",
}, {
    name: "Nested function",
    annotation: {
        type: "function",
        params: [{
            name: "id",
            ann: {
                type: "base",
                name: "number",
            },
        }, {
            name: "cb",
            ann: {
                type: "function",
                params: [{
                    name: "user",
                    ann: {
                        type: "type-ref",
                        path: "index.js",
                        name: "User",
                        params: [],
                    },
                }],
                returnType: {type: "void"},
            },
        }],
        returnType: {type: "void"},
    },
    swift: "(id: Int, cb: (user: SwiftUser) -> Void) -> Void",
    json: "Int",
}];

describe("asSwiftTypeSignature", () => {
    fixtures.forEach(fixture => {
        const name = (fixture.name || JSON.stringify(fixture.annotation));
        it("should serialize " + name, () => {
            expect(asSwiftTypeSignature(fixture.annotation, config))
                .toEqual(fixture.swift);
        });
    });
});

describe("asJsonTypeSignature", () => {
    fixtures.forEach(fixture => {
        const name = (fixture.name || JSON.stringify(fixture.annotation));
        it("should serialize " + name, () => {
            expect(asJsonTypeSignature(fixture.annotation, modules))
                .toEqual(fixture.json || fixture.swift);
        });
    });
});
