/**
 * Tests for flow ast parsing
 */

import getFlowTypes from "../src/flow";

import path from "path";
import expect from "expect";
import {describe, it, before} from "mocha";

const BASE = path.join(__dirname, "./ast/base.js");
const COMPLEX = path.join(__dirname, "./ast/complex.js");
const DEPS = path.join(__dirname, "./ast/deps.js");

describe("getFlowTypes", () => {
    it("should parse base file without error", () => {
        getFlowTypes(BASE);
    });

    describe("with a simple type declaration", () => {
        let modules;
        before(() => {
            modules = getFlowTypes(BASE);
        });

        it("should have the 'Props' type", () => {
            expect(modules[BASE].Props).toExist();
            expect(modules[BASE].Props.type).toEqual("object");
        });

        it("should process base types", () => {
            expect(modules[BASE].Props.attrs.anum).toEqual({
                type: "base",
                name: "number",
            });
            expect(modules[BASE].Props.attrs.astr).toEqual({
                type: "base",
                name: "string",
            });
            expect(modules[BASE].Props.attrs.abool).toEqual({
                type: "base",
                name: "boolean",
            });
        });

        it("should process literals", () => {
            expect(modules[BASE].Props.attrs.name).toEqual({
                type: "string-literal",
                value: "codegen",
            });
            expect(modules[BASE].Props.attrs.age).toEqual({
                type: "number-literal",
                value: 42,
            });
            expect(modules[BASE].Props.attrs.isGreat).toEqual({
                type: "boolean-literal",
                value: true,
            });
        });
    });

    it("should parse complex file without error", () => {
        getFlowTypes(COMPLEX);
    });

    describe("with a complex type declaration", () => {
        let modules;
        before(() => {
            modules = getFlowTypes(COMPLEX);
        });

        it("should parse the 'User' type correctly", () => {
            expect(modules[COMPLEX].User).toExist();
            expect(modules[COMPLEX].User.type).toEqual("object");

            // check the optional type
            expect(modules[COMPLEX].User.attrs.title).toEqual({
                type: "optional",
                inner: {
                    type: "base",
                    name: "string",
                },
            });
        });

        it("should have a Props type", () => {
            expect(modules[COMPLEX].Props).toExist();
            expect(modules[COMPLEX].Props.type).toEqual("object");
        });

        it("should parse the type-ref correctly", () => {
            expect(modules[COMPLEX].Props.attrs.user).toEqual({
                type: "type-ref",
                path: COMPLEX,
                name: "User",
                params: [],
            });
        });

        it("should parse an optional correctly", () => {
            expect(modules[COMPLEX].Props.attrs.parent).toEqual({
                type: "optional",
                inner: {
                    type: "type-ref",
                    path: COMPLEX,
                    params: [],
                    name: "User",
                },
            });
        });

        it("should parse a simple function correctly", () => {
            expect(modules[COMPLEX].Props.attrs.onClose).toEqual({
                type: "function",
                params: [],
                returnType: {type: "void"},
            });
        });

        it("should parse a complex function correctly", () => {
            expect(modules[COMPLEX].Props.attrs.onUpdateCount).toEqual({
                type: "function",
                params: [{
                    name: "user",
                    ann: {
                        type: "type-ref",
                        name: "User",
                        params: [],
                        path: COMPLEX,
                    },
                }, {
                    name: "count",
                    ann: {
                        type: "base",
                        name: "number",
                    },
                }],
                returnType: {type: "void"},
            });
        });

        it("should parse a nested function correctly", () => {
            expect(modules[COMPLEX].Props.attrs.getUser).toEqual({
                type: "function",
                params: [{
                    name: "cb",
                    ann: {
                        type: "function",
                        params: [{
                            name: "user",
                            ann: {
                                type: "type-ref",
                                params: [],
                                name: "User",
                                path: COMPLEX,
                            },
                        }],
                        returnType: {type: "void"},
                    },
                }],
                returnType: {type: "void"},
            });
        });
    });

    it("should parse file with dependencies without error", () => {
        getFlowTypes(DEPS);
    });

    describe("with a complex type declaration", () => {
        let modules;
        before(() => {
            modules = getFlowTypes(DEPS);
        });

        it("should have a Props type", () => {
            expect(modules[DEPS].Props).toExist();
            expect(modules[DEPS].Props.type).toEqual("object");
        });

        it("should resolve an imported type", () => {
            expect(modules[DEPS].Props.attrs.user).toEqual({
                type: "type-ref",
                path: DEPS,
                params: [],
                name: "User",
            });
            expect(modules[DEPS].User).toEqual({
                type: "type-ref",
                path: COMPLEX,
                params: [],
                name: "User",
            });
            expect(modules[COMPLEX].User).toExist();
            expect(modules[COMPLEX].User.type).toEqual("object");
        });

        it("should resolve a renamed import correctly", () => {
            expect(modules[DEPS].Props.attrs.base).toEqual({
                type: "type-ref",
                path: DEPS,
                params: [],
                name: "BaseProps",
            });
            expect(modules[DEPS].BaseProps).toEqual({
                type: "type-ref",
                path: BASE,
                params: [],
                name: "Props",
            });
            expect(modules[COMPLEX].Props).toExist();
            expect(modules[COMPLEX].Props.type).toEqual("object");
        });

    });

});
