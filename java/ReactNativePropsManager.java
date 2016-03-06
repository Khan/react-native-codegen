package org.khanacademy.codegen;

import java.util.ArrayList;

public class ReactNativePropsManager {
    private ArrayList<Integer> callbackIds = new ArrayList<>();
    public ReactNativePropsManager() {}

    protected int registerCallback(ReactNativeCallbackManager.Callback callback) {
        int id = ReactNativeCallbackManager.registerCallback(callback);
        callbackIds.add(id);
        return id;
    }
}
