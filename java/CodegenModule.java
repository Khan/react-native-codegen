package org.khanacademy.codegen;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class CodegenModule extends ReactContextBaseJavaModule {

  public CodegenModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ReactNativeCallbackManager";
  }

  @ReactMethod
  public void callBack(int id, ReadableMap arguments) {
      ReactNativeCallbackManager.callBack(id, Arguments.toBundle(arguments));
  }
}
