/**
 * Responsible for generating swift files (the ViewController and the
 * PropsManager) for a given `Props` definition.
 *
 * @flow
 */

import {asJavaTypeSignature, asJsonTypeSignature} from "./signatures";
import {indentedLines, capitalize, listValues} from "../swift/utils";
import warningText from "../warning-text";

import type {
    Modules,
    ConfigTypes,
} from "../types";

/*
import preparePropsManager from "./prepare-props-manager";
import makeProperties from "./properties";
*/

const createSerializer = (typeName, annotation, inner, marshallingMethods, modules, config) => {
    let body = "";
    let value = "";
    if (inner.type === "object") {
        const subSetters = inner.keys.map(key => {
            // TODO(jared): the bundle names might overlap...
            const value = javaToJson("value." + key + "()", inner.attrs[key], marshallingMethods, modules, config);
            const setter = getBundleType(inner, modules);
            return `bundle.put${setter}("${key}", ${value});`;
        }).join("\n");
        body = `\
final Bundle bundle = new Bundle();
${subSetters}
return bundle;`
        value = "bundle";
    } else {
        value = "return " + javaToJson("value", inner, marshallingMethods, modules, config) + ";";
    }
    const jsonType = asJsonTypeSignature(annotation, modules);
    const javaType = asJavaTypeSignature(annotation, false, config);
    return `private ${jsonType} serialize${typeName}(final ${javaType} value) {
    ${indentedLines([body], "\n", 2)}
}`;
}

const getBundleType = (annotation, modules) => {
    switch (annotation.type) {
        case "base":
            return {
                string: "String",
                number: "Integer",
                boolean: "Boolean",
            }[annotation.name];
        case "function":
            return "Integer";
        case "type-ref":
            return getBundleType(modules[annotation.path][annotation.name], modules);
        case "object":
            return "Bundle";
        case "optional":
            return getBundleType(annotation.inner, modules);
    }
    throw new Error(`Unexpected type ${annotation.type}`);
}

const createDeserializer = () => "DESERIALIZE";

const jsonToJava = (varName, annotation, marshallingMethods, modules, config) => {
    switch (annotation.type) {
        case "base":
            return varName;
        case "function":
            return `IDK FUnCTION`;
        case "type-ref":
            const inner = modules[annotation.path][annotation.name];
            const javaName = config[annotation.path][annotation.name].java;
            if (marshallingMethods.deserialize[javaName] === undefined) {
                marshallingMethods.deserialize[javaName] = "";
                marshallingMethods.deserialize[javaName] = createDeserializer(annotation.name, inner, marshallingMethods, modules, config);
            }
            return `deserialize${annotation.name}(${varName})`;
        case "optional":
            return "OPTIONAL";
    }
    return "UNKNOWN " + JSON.stringify(annotation);
};

const javaToJson = (varName, annotation, marshallingMethods, modules, config) => {
    switch (annotation.type) {
        case "base":
            return varName;
        case "function":
            const args = annotation.params.map(param => {
                const bundleType = getBundleType(param.ann, modules);
                return jsonToJava(`bundle.get${bundleType}(${param.name})`, param.ann, marshallingMethods, modules, config)
            }).join(', ');
            return `ReactNativeCallbackManager.registerCallback(bundle -> {
    ${varName}(${args});
})`;
            // return `${}.setInteger("${keyName}", ReactNativeCallbackManager.registerCallback());`
        case "type-ref":
            const inner = modules[annotation.path][annotation.name];
            const javaName = config[annotation.path][annotation.name].java;
            if (marshallingMethods.serialize[javaName] == undefined) {
                marshallingMethods.serialize[javaName] = "";
                marshallingMethods.serialize[javaName] = createSerializer(annotation.name, annotation, inner, marshallingMethods, modules, config);
            }
            return `serialize${annotation.name}(${varName})`;
        case "optional":
            return "OPTIONAL";
    }
    return "UNKNOWN " + JSON.stringify(annotation);
};

const createSerializers = (props, modules, config) => {
    const marshallingMethods = {serialize: {}, deserialize: {}};
    const createBundle = indentedLines(props.keys.map(key => {
        const setter = getBundleType(props.attrs[key], modules);
        const value = javaToJson(key, props.attrs[key], marshallingMethods, modules, config);
        return `bundle.put${setter}("${key}", ${value});`
    }), "\n", 6);
    const serializeMethods = indentedLines(listValues(marshallingMethods.serialize), "\n\n", 4);
    const deserializeMethods = indentedLines(listValues(marshallingMethods.deserialize), "\n\n", 4);
    return {createBundle, deserializeMethods, serializeMethods};
}

const makeProperty = (name, annotation, config) => {
    const javaType = asJavaTypeSignature(annotation, false, config);
    return `private ${javaType} ${name};`
};

const makeProperties = (props, config) => {
    return indentedLines(props.keys.map(key => makeProperty(key, props.attrs[key], config)), "\n", 2);
};

const makePropSetters = (props) => {
    return indentedLines(props.keys.map(key => `this.${key} = checkNotNull(${key})`), "\n", 4);
}

const makePassProps = (props) => {
    return props.keys.join(', ');
};

const makeSetters = (props, config) => {
    return indentedLines(props.keys.map(key => {
        const capName = capitalize(key);
        const javaType = asJavaTypeSignature(props.attrs[key], false, config);
        return `public void set${capName}(${key}: ${javaType}) {
    this.${key} = checkNotNull(${key});
}`
    }), "\n\n", 2)
};

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
        const javaType = asJavaTypeSignature(props.attrs[key], false, config);
        return `final ${javaType} ${key}`;
    }).join(', ');

    const {createBundle, deserializeMethods, serializeMethods} = createSerializers(props, modules, config);
    const properties = makeProperties(props, config);
    const setProps = makePropSetters(props);
    const passProps = makePassProps(props);
    const setters = makeSetters(props, config);

    return warningText(filePath) + `\
final public class ${className} {

    private static final class ${className}PropsManager: ReactNativePropsManager {
        public static Bundle createBundle(${args}) {
            final Bundle bundle = new Bundle();
            ${createBundle}
            return bundle;
        }
        ${deserializeMethods}${serializeMethods}
    }

    private final ReactRootView mReactRootView;
    private final ReactInstanceManager mReactInstanceManager;

    ${properties}

    public ${className}(Activity activity${args ? ", " + args : ""}) {
        mReactRootView = new ReactRootView(activity);
        mReactInstanceManager = ReactInstanceManager.builder()
            .setApplication(activity.getApplication())
            .setBundleAssetName("index.android.bundle")
            .setJSMainModuleName("index.android")
            .addPackage(new MainReactPackage())
            .setUseDeveloperSupport(BuildConfig.DEBUG)
            .setInitialLifecycleState(LifecycleState.RESUMED)
            .build();

        ${setProps}

        final Bundle initialProps = ${className}PropsManager.createBundle(${passProps});
        mReactRootView.startReactApplication(mReactInstanceManager, "${className}", bundle);

        mReactInstanceManager.showDevOptionsDialog();
    }

    public View getView() {
        return mReactRootView;
    }

    ${setters}

    public void flush() {
        final Bundle props = ${className}PropsManager.createBundle(${passProps});
        // TODO don't know how to do this...
        // mReactRootView.startReactApplication(mReactInstanceManager, "${className}", bundle);
        // v how do I get this?
        // catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams);
    }
}`
}

