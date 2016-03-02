//
//  This is a supporting file for react-native-codegen, and needs to be
//  included in your Xcode project for it to function correctly.
//
//  The ReactNativeCallbackManager tracks functions that need to be exposed to
//  the JavaScript side. A function that is passed in as props to a react
//  native component is replaced with an Integer ID, and then the javascript
//  wrapper uses that ID to make the callback.
//
//  The ReactNativeCallbackManagerBridge is exposed to the JavaScript side as
//  `require('react-native').NativeModules.ReactNativeCallbackManager`.
//

import Foundation

public class ReactNativeCallbackManager {
	public static let sharedInst: ReactNativeCallbackManager = ReactNativeCallbackManager()

	private var callbacks: [Int: ([String: AnyObject]) -> Void] = [:]
	private var id: Int = 0

	public static func registerCallback(fn: ([String: AnyObject]) -> Void) -> Int {
		let id = sharedInst.id++
		sharedInst.callbacks[id] = fn
		return id
	}

	public static func unregisterCallback(id: Int) {
		sharedInst.callbacks.delete(id)
	}

	public static func unregisterCallbacks(ids: [Int]) {
		ids.forEach(unregisterCallback)
	}

	@objc public static func callBack(id: Int, arguments: [String: AnyObject]) {
		guard let callback = sharedInst.callbacks[id] else {
			logAndAbort("Trying to call an unknown callback \(id)")
		}
		callback(arguments)
	}

	public static func callJS(id: Int, args: [String: AnyObject]) {
		// TODO(jared): fire off a JS Native Event
	}
}

@objc(ReactNativeCallbackManagerBridge)
public class ReactNativeCallbackManagerBridge: NSObject {

	@objc public func callBack(id: NSInteger, arguments: NSDictionary) {
		NSLog("Callbed back!\(id) :: \(arguments)")
		ReactNativeCallbackManager.callBack(id, arguments: arguments as! [String : AnyObject])
	}

	// React Native uses this function to know how to expose `callBack` to the
	// javascript side.
	@objc public static func __rct_export__1() -> Array<String> {
		return ["callBack", "callBack:(nonnull NSInteger*)id arguments:(NSDictionary*)arguments"]
	}
}

extension ReactNativeCallbackManagerBridge: RCTBridgeModule {
	@objc public static func moduleName () -> String {
		return "ReactNativeCallbackManager"
	}
}
