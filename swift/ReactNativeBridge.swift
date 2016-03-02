//
//  The ReactNativeBridge is a supporting class for react-native-codegen and
//  needs to be included in your Xcode project for it to function correctly.
//

import Foundation

public class ReactNativeBridge: NSObject {
	public static let sharedInstance = ReactNativeBridge()

	private var bridge: RCTBridge?
	private var url: NSURL?

	public func setupWithURL(url: NSURL) {
		self.url = url
		RCTRegisterModule(ReactNativeCallbackManagerBridge)
		bridge = RCTBridge.init(delegate: self, launchOptions: nil)
	}

	public func callJS(id: Int, arguments: [String: AnyObject]) {
		let body: [String: AnyObject] = ["id": id, "args": arguments]
		getBridge().eventDispatcher.sendAppEventWithName("CallJS", body:body)
	}

	public func getBridge() -> RCTBridge {
		assertAndLog(bridge != nil, message: "Bridge not initialized!")
		return bridge!
	}

	public func createRootComponentForModule(moduleName: String, initialProperties: Dictionary<String, AnyObject>?) -> RCTRootView {
		return RCTRootView.init(bridge: getBridge(), moduleName: moduleName, initialProperties: initialProperties)
	}
}

extension ReactNativeBridge: RCTBridgeDelegate {
	@objc public func sourceURLForBridge(bridge: RCTBridge) -> NSURL {
		assertAndLog(url != nil, message: "Must call setup before using as a BridgeDelegate")
		return self.url!
	}
}
