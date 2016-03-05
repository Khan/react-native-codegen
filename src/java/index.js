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
    if (inner.type === "object") {
        const subSetters = inner.keys.map(key => {
            // TODO(jared): the bundle names might overlap...
            const value = javaToJson("value." + key + "()", inner.attrs[key], marshallingMethods, modules, config);
            const bundleType = getBundleType(inner.attrs[key], modules);
            return `bundle.put${bundleType}("${key}", ${value});`;
        }).join("\n");
        body = `\
final Bundle bundle = new Bundle();
${subSetters}
return bundle;`
    } else {
        body = "return " + javaToJson("value", inner, marshallingMethods, modules, config) + ";";
    }
    const jsonType = asJsonTypeSignature(annotation, modules);
    const javaType = asJavaTypeSignature(annotation, false, config);
    return `private ${jsonType} serialize${typeName}(final ${javaType} value) {
    ${indentedLines([body], "\n", 2)}
}`;
}

const createDeserializer = (typeName, annotation, inner, marshallingMethods, modules, config) => {
    let body = "";
    const jsonType = asJsonTypeSignature(annotation, modules);
    const javaType = asJavaTypeSignature(annotation, false, config);
    if (inner.type === "object") {
        const args = inner.keys.map(key => {
            const bundleType = getBundleType(inner.attrs[key], modules);
            return jsonToJava(`value.get${bundleType}("${key}")`, inner.attrs[key], marshallingMethods, modules, config);
        }).join(', ');
        body = `return ${javaType}.create(${args});`
    } else {
        body = "return " + jsonToJava("value", inner, marshallingMethods, modules, config) + ";";
    }
    return `private ${javaType} deserialize${typeName}(final ${jsonType} value) {
    ${indentedLines([body], "\n", 2)}
}`;
}

const getBundleType = (annotation, modules) => {
    switch (annotation.type) {
        case "base":
            return {
                string: "String",
                number: "Int",
                boolean: "Boolean",
            }[annotation.name];
        case "function":
            return "Int";
        case "type-ref":
            return getBundleType(modules[annotation.path][annotation.name], modules);
        case "object":
            return "Bundle";
        case "optional":
            return getBundleType(annotation.inner, modules);
    }
    throw new Error(`Unexpected type ${annotation.type}`);
}

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
                marshallingMethods.deserialize[javaName] = createDeserializer(annotation.name, annotation, inner, marshallingMethods, modules, config);
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
                return jsonToJava(`argsBundle.get${bundleType}("${param.name}")`, param.ann, marshallingMethods, modules, config)
            }).join(', ');
            return `registerCallback(argsBundle -> {
    ${varName}.call(${args});
})`;
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
    return indentedLines(props.keys.map(key => `this.${key} = checkNotNull(${key});`), "\n", 4);
}

const makePassProps = (props) => {
    return props.keys.join(', ');
};

const makeSetters = (props, config) => {
    return indentedLines(props.keys.map(key => {
        const capName = capitalize(key);
        const javaType = asJavaTypeSignature(props.attrs[key], false, config);
        return `public void set${capName}(final ${javaType} ${key}) {
    this.${key} = checkNotNull(${key});
    // TODO(jared): enqueue props flush
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

    return `package org.khanacademy.android.ui.reactnative;

${warningText(filePath)}

import static com.google.gson.internal.$Gson$Preconditions.checkNotNull;

import org.khanacademy.android.BuildConfig;
import org.khanacademy.codegen.ReactNativePropsManager;

import com.facebook.react.LifecycleState;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.uimanager.AppRegistry;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;

final public class ${className} {
    public interface Fn0args {
        void call();
    }

    public interface Fn1args<A> {
        void call(A arg);
    }

    public interface Fn2args<A, B> {
        void call(A arg1, B arg2);
    }

    public interface Fn3args<A, B, C> {
        void call(A arg1, B arg2, C arg3);
    }

    public interface Fn4args<A, B, C, D> {
        void call(A arg1, B arg2, C arg3, D arg4);
    }

    private static final class ${className}PropsManager extends ReactNativePropsManager {
        public Bundle createBundle(${args}) {
            final Bundle bundle = new Bundle();
            ${createBundle}
            return bundle;
        }
        ${deserializeMethods}${serializeMethods}
    }

    private final ReactRootView mReactRootView;
    private final ReactInstanceManager mReactInstanceManager;
    private final ${className}PropsManager mPropsManager;

    ${properties}

    public ${className}(Activity activity${args ? ", " + args : ""}) {
        mReactRootView = new ReactRootView(checkNotNull(activity));
        mReactInstanceManager = ReactInstanceManager.builder()
            .setApplication(checkNotNull(activity.getApplication()))
            .setBundleAssetName("index.android.bundle")
            .setJSMainModuleName("index.android")
            .addPackage(new CodegenPackage())
            .addPackage(new MainReactPackage())
            .setUseDeveloperSupport(BuildConfig.DEBUG)
            .setInitialLifecycleState(LifecycleState.RESUMED)
            .build();

        mPropsManager = new ${className}PropsManager();

        ${setProps}

        final Bundle initialProps = mPropsManager.createBundle(${passProps});
        mReactRootView.startReactApplication(mReactInstanceManager, "${className}", initialProps);

        mReactInstanceManager.showDevOptionsDialog();
    }

    public View getView() {
        return mReactRootView;
    }

    ${setters}

    public void updateProps(final Bundle newProps) {
        WritableNativeMap appParams = new WritableNativeMap();
        appParams.putDouble("rootTag", 1); // HACK(jared): assuming there's only one root tag. could cause crazy problems
        appParams.putMap("initialProps", Arguments.fromBundle(newProps));
        final CatalystInstance catalystInstance = mReactInstanceManager.getCurrentReactContext().getCatalystInstance();
        catalystInstance.getJSModule(AppRegistry.class).runApplication("${className}", appParams);
    }

    public void flush() {
        final Bundle props = mPropsManager.createBundle(${passProps});
        updateProps(props);
    }
}`
}

