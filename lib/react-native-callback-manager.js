/**
 * This is a supporting file for react-native-codegen
 */

// $FlowIgnore
import {NativeModules, NativeAppEventEmitter} from 'react-native';

class ReactNativeCallbackManager {
    constructor() {
        this.id = 0;
        NativeAppEventEmitter.addListener("CallJS", ({id, args}) => {
            this.callbacks[id](args);
        });
    }
    callNative(id: number, args: object) {
        NativeModules.ReactNativeCallbackManager.callBack(id, args);
    }
    registerCallback(fn) {
        const id = this.id++;
        this.callbacks[id] = fn;
        return id;
    }
    unregisterCallbacks(ids) {
        ids.forEach(id => {
            delete this.callbacks[id];
        });
    }
}

export default new ReactNativeCallbackManager();
