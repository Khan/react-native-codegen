/**
 * Tests for ViewController properties generation
 *
 * @flow
 */

import expect from "expect";
import {describe, it} from "mocha";

import makeProperties from "../../src/swift/properties";

const config = {};
const modules = {
    index: {
        Props: {
            type: "object",
            keys: ["base", "fn"],
            attrs: {
                base: {type: "base", name: "string"},
                fn: {
                    type: "function",
                    params: [],
                    returnType: {type: "void"},
                },
            },
        },
    },
};

describe("makeProperties", () => {
    it("should generate a well-formatted list of property declarations", () => {
        const output = makeProperties(modules.index.Props, modules, config);
        expect(output).toEqual(`public var base: String {
    didSet {
      if user != oldValue {
        propsManager.setBase(base)
      }
    }
  }

  public var fn: () -> Void {
    didSet {
      propsManager.setFn(fn)
    }
  }`);
    });
});
