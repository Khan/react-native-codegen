/**
 * This class was AUTO-GENERATED by react-native-codegen, and should not be
 * edited manually. If there is an error, make a change to
 * react-native-codegen. If you want to add another attribute, change the
 * `Props` declaration in "./example/index.js".
 */
public class KitchenSinkPropsManager: ReactNativePropsManager {
  init(user: User, currentVideo: Video, setVideo: (video: Video, count: Int) -> Void, getNextVideo: (cb: (video: Video) -> Void) -> Void, getVideoForUser: (user: User, cb: (video: Video) -> Void) -> Void, onClose: () -> Void, onError: (message: String) -> Void) {
    super.init()
    setUser(user)
    setCurrentVideo(currentVideo)
    setSetVideo(setVideo)
    setGetNextVideo(getNextVideo)
    setGetVideoForUser(getVideoForUser)
    setOnClose(onClose)
    setOnError(onError)
  }

  public func setUser(user: User) {
    serialized["user"] = self.serializeUser(user)
  }

  public func setCurrentVideo(currentVideo: Video) {
    serialized["currentVideo"] = self.serializeVideo(currentVideo)
  }

  public func setSetVideo(setVideo: (video: Video, count: Int) -> Void) {
    serialized["setVideo"] = registerCallback({args in
      let video: Video = self.deserializeVideo(args["video"]! as! [String: AnyObject])
      let count: Int = args["count"]! as! Int
      setVideo(video: video, count: count)
    })
  }

  public func setGetNextVideo(getNextVideo: (cb: (video: Video) -> Void) -> Void) {
    serialized["getNextVideo"] = registerCallback({args in
      let cb: (video: Video) -> Void = {(video: Video) in
        let video_json: [String: AnyObject] = self.serializeVideo(video)
        ReactNativeCallbackManager.callJS(args["cb"]! as! Int, args: ["video": video_json])
      }
      getNextVideo(cb: cb)
    })
  }

  public func setGetVideoForUser(getVideoForUser: (user: User, cb: (video: Video) -> Void) -> Void) {
    serialized["getVideoForUser"] = registerCallback({args in
      let user: User = self.deserializeUser(args["user"]! as! [String: AnyObject])
      let cb: (video: Video) -> Void = {(video: Video) in
        let video_json: [String: AnyObject] = self.serializeVideo(video)
        ReactNativeCallbackManager.callJS(args["cb"]! as! Int, args: ["video": video_json])
      }
      getVideoForUser(user: user, cb: cb)
    })
  }

  public func setOnClose(onClose: () -> Void) {
    serialized["onClose"] = registerCallback({args in
      onClose()
    })
  }

  public func setOnError(onError: (message: String) -> Void) {
    serialized["onError"] = registerCallback({args in
      let message: String = args["message"]! as! String
      onError(message: message)
    })
  }

  func deserializeVideo(val: [String: AnyObject]) -> Video {
    let uri: String = val["uri"]! as! String
    let length: Int = val["length"]! as! Int
    let description: VideoDescription = self.deserializeVideoDescription(val["description"]! as! [String: AnyObject])
    return Video(uri: uri, length: length, description: description)
  }

  func deserializeVideoDescription(val: [String: AnyObject]) -> VideoDescription {
    let lastEdited: Int = val["lastEdited"]! as! Int
    let author: String = val["author"]! as! String
    let text: String = val["text"]! as! String
    return VideoDescription(lastEdited: lastEdited, author: author, text: text)
  }

  func deserializeUser(val: [String: AnyObject]) -> User {
    let id: Int = val["id"]! as! Int
    let name: String = val["name"]! as! String
    let isAdmin: Bool = val["isAdmin"]! as! Bool
    return User(id: id, name: name, isAdmin: isAdmin)
  }

  func serializeUser(val: User) -> [String: AnyObject] {
    let id: Int = val.id
    let name: String = val.name
    let isAdmin: Bool = val.isAdmin
    return ["id": id, "name": name, "isAdmin": isAdmin]
  }

  func serializeVideo(val: Video) -> [String: AnyObject] {
    let uri: String = val.uri
    let length: Int = val.length
    let description: [String: AnyObject] = self.serializeVideoDescription(val.description)
    return ["uri": uri, "length": length, "description": description]
  }

  func serializeVideoDescription(val: VideoDescription) -> [String: AnyObject] {
    let lastEdited: Int = val.lastEdited
    let author: String = val.author
    let text: String = val.text
    return ["lastEdited": lastEdited, "author": author, "text": text]
  }

}