//
//  This is a supporting file for react-native-codegen, and needs to be
//  included in your Xcode project for it to function correctly.
//

public class ReactNativePropsManager {
	public var serialized: [String: AnyObject] = [:]
	private var callbacks: Array<Int> = []

	func registerCallback(cb: ([String: AnyObject]) -> Void) -> Int {
		let id = ReactNativeCallbackManager.registerCallback(cb)
		callbacks.append(id)
		return id
	}

	deinit {
		ReactNativeCallbackManager.unregisterCallbacks(callbacks)
	}
}
