/**
 * Responsible for generating swift files (the ViewController and the
 * PropsManager) for a given `Props` definition.
 *
 * @flow
 */

import {asSwiftTypeSignature} from "./signatures";
import {indentedLines, capitalize} from "./utils";
import preparePropsManager from "./prepare-props-manager";
import makeProperties from "./properties";
import warningText from "../warning-text";

import type {
    Modules,
    ConfigTypes,
} from "../types";


export default (
    className: string,
    filePath: string,
    modules: Modules,
    config: ConfigTypes
): string => {
    const props = modules[filePath].Props;
    if (props.type !== "object") {
        throw new Error("Expected Props to be an object");
    }
    const args = props.keys.map(key => {
        const swiftType = asSwiftTypeSignature(props.attrs[key], config);
        return `${key}: ${swiftType}`;
    }).join(", ");

    // For View Controller
    const propertyDeclarations = makeProperties(props, modules, config);
    const setProperties = indentedLines(props.keys.map(
      key => `self.${key} = ${key}`
    ), "\n", 2);
    const propsManagerArgs = props.keys.map(key => `${key}: ${key}`).join(", ");

    // For Props Manager
    const inits = indentedLines(props.keys.map(
      key => `set${capitalize(key)}(${key})`
    ), "\n", 4);
    const {setters, deserializeMethods, serializeMethods} = preparePropsManager(
      props, modules, config);

    return warningText(filePath) + `\
public class ${className} {

  private class ${className}PropsManager: ReactNativePropsManager {

    init(${args}) {
      super.init()
      ${inits}
    }

    ${setters}${deserializeMethods}${serializeMethods}

  }

  private let propsManager: ${className}PropsManager
  public let view: RCTRootView

  ${propertyDeclarations}

  init(${args}) {
    self.propsManager = ${className}PropsManager(${propsManagerArgs})
    ${setProperties}
    self.view = ReactNativeBridge.sharedInstance.createRootComponentForModule(
      "${className}", initialProperties: propsManager.serialized)
  }

  required public init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  /**
   * Re-render the React root view with the current state of the serialized
   * props
   */
  public func flush() {
    dispatch_async(dispatch_get_main_queue()) {
      self.view.appProperties = self.propsManager.serialized
    }
  }
}`
};
