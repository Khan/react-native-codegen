
package org.khanacademy.codegen;

import android.os.Bundle;

import java.util.HashMap;

final public class ReactNativeCallbackManager {
    public static ReactNativeCallbackManager sharedInst = new ReactNativeCallbackManager();

    private int nextId = 0;

    public interface Callback {
        void call(Bundle bundle);
    }

    private HashMap<Integer, Callback> callbacks = new HashMap<>();

    public ReactNativeCallbackManager() { }

    public static int registerCallback(Callback callback) {
        final int id = sharedInst.nextId;
        sharedInst.nextId++;
        sharedInst.callbacks.put(id, callback);
        return id;
    }

    public static void callBack(int id, Bundle arguments) {
        if(!sharedInst.callbacks.containsKey(id)) {
                throw new IllegalArgumentException("Unknown callback id");
        }
        sharedInst.callbacks.get(id).call(arguments);
    }
}

