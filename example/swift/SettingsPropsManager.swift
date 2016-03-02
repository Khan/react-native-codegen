/**
 * This class was AUTO-GENERATED by react-native-codegen, and should not be
 * edited manually. If there is an error, make a change to
 * react-native-codegen. If you want to add another attribute, change the
 * `Props` declaration in "./example/Settings.js".
 */
public class SettingsPropsManager: ReactNativePropsManager {
  init(shouldShowLogOutButton: Bool, availableDiskSpaceInBytes: Int, onlyDownloadOverWifi: Bool, checkAnswer: (answer: String, cb: (isCorrect: Bool) -> Void) -> Void, onSignOut: () -> Void, onFeedbackNav: () -> Void, onSetDownloadOverWifi: (downloadOverWifi: Bool) -> Void) {
    super.init()
    setShouldShowLogOutButton(shouldShowLogOutButton)
    setAvailableDiskSpaceInBytes(availableDiskSpaceInBytes)
    setOnlyDownloadOverWifi(onlyDownloadOverWifi)
    setCheckAnswer(checkAnswer)
    setOnSignOut(onSignOut)
    setOnFeedbackNav(onFeedbackNav)
    setOnSetDownloadOverWifi(onSetDownloadOverWifi)
  }

  public func setShouldShowLogOutButton(shouldShowLogOutButton: Bool) {
    serialized["shouldShowLogOutButton"] = shouldShowLogOutButton
  }

  public func setAvailableDiskSpaceInBytes(availableDiskSpaceInBytes: Int) {
    serialized["availableDiskSpaceInBytes"] = availableDiskSpaceInBytes
  }

  public func setOnlyDownloadOverWifi(onlyDownloadOverWifi: Bool) {
    serialized["onlyDownloadOverWifi"] = onlyDownloadOverWifi
  }

  public func setCheckAnswer(checkAnswer: (answer: String, cb: (isCorrect: Bool) -> Void) -> Void) {
    serialized["checkAnswer"] = registerCallback({args in
      let answer: String = args["answer"]! as! String
      let cb: (isCorrect: Bool) -> Void = {(isCorrect: Bool) in
        let isCorrect_json: Bool = isCorrect
        ReactNativeCallbackManager.callJS(args["cb"]! as! Int, args: ["isCorrect": isCorrect_json])
      }
      checkAnswer(answer: answer, cb: cb)
    })
  }

  public func setOnSignOut(onSignOut: () -> Void) {
    serialized["onSignOut"] = registerCallback({args in
      onSignOut()
    })
  }

  public func setOnFeedbackNav(onFeedbackNav: () -> Void) {
    serialized["onFeedbackNav"] = registerCallback({args in
      onFeedbackNav()
    })
  }

  public func setOnSetDownloadOverWifi(onSetDownloadOverWifi: (downloadOverWifi: Bool) -> Void) {
    serialized["onSetDownloadOverWifi"] = registerCallback({args in
      let downloadOverWifi: Bool = args["downloadOverWifi"]! as! Bool
      onSetDownloadOverWifi(downloadOverWifi: downloadOverWifi)
    })
  }

}