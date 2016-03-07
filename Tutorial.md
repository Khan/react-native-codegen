# React Native Codegen tutorial

In a not-necessarily-too-distant future...

You're tasked with writing a new view for listing bookmarks. The data
structure has already been defined. On iOS, a bookmark is represented as a
swift `struct`; on Android, it's an `AutoValue`. The user should be able to
click on a bookmark and be sent to that page.

There should also be a toggle at the top to set whether only downloaded items
should be shown.

## The Data

These models are already defined in the codebase, and we'll be passing in
bookmarks as data to the new react native view.

```swift
struct Bookmark {
  let contentId: String;
  let title: String;
  let addedDate: Int;
}
```

```java
@AutoValue
public abstract class Bookmark {
  public abstract String contentId();
  public abstract String title();
  public abstract int addedDate();
}
```

## The Javascript

You make a new file in the `mobile-shared-views` repo,
`./views/BookmarksPage.js`:

```js
import React, {Text} from 'react-native';
import {Toggle} from 'ka-react-components';

export type Bookmark = {
  contentId: string,
  title: string,
  addedDate: number,
};

export type Props = {
  bookmarks: Array<Bookmark>,
  showOnlyDownloaded: boolean,
  setShowOnlyDownloaded: (value: boolean) => void,
  onNavigateToBookmark: (bookmark: Bookmark) => void,
};

const styles = { ... }

class Bookmark extends React.Component {
  // ... show the bookmark
}

export default class BookmarksPage extends React.Component {
  render() {
    return <View>
      <View style={styles.topBar}>
        <Text style={styles.title}>Bookmarks</Text>
        <Toggle
          label="Show only downloaded"
          value={this.props.showOnlyDownloaded}
          onChange={this.props.setShowOnlyDownloaded}
        />
      </View>
      <View style={styles.bookmarks}>
        {this.props.bookmarks.map(bookmark =>
          <Bookmark
            data={bookmark}
            onNavigate={() => this.props.onNavigateToBookmark(bookmark)}
          />
        )}
      </View>
    </View>
  }
}
```

## The Configuration

You edit the `./codegen.yaml` config file in the `mobile-shared-views` repo,
to specify what java & swift types correspond to the types you're using in the
`BookmarksView`.

```yaml
types:
  "./views/BookmarksPage.js":
    Bookmark:
      swift: Bookmark
      java: org.khanacademy.models.Bookmark
```

Then run `npm run generate` in the `mobile-shared-views` repo, and three files
are generated for you:

- `./views/BookmarksPageWrapper.js`
- `./swift/BookmarksPage.swift`
- `./java/BookmarksPage.java`

Finally, add an entry to `./index.ios.js` and `./index.android.js` referencing
the newly-generated javascript wrapper.

```js
import BookmarksPageWrapper from "./views/BookmarksPageWrapper";

AppRegistry.registerComponent('BookmarksPage', () => BookmarksPageWrapper);
```

## Using the view in the apps

In the 2 apps, `mobile-shared-views` is setup as a submodule, linked into the
right place so that the generated swift and java classes are usable in normal
code.

### Swift

You make a view controller to house the react view and manage the state:

```swift
public class BookmarksViewController: UIViewController {
  private var reactNativeView: BookmarksView {
    return self.view as! BookmarksView
  }

  ...

  override public func loadView() {
    view = BookmarksView(
      bookmarks: ..., // the initial data
      showOnlyDownloaded: ..., // the initial data
      setShowOnlyDownloaded: { showOnlyDownloaded in
        // actually change the setting somewhere
        self.handleShowOnlyDownloaded(showOnlyDownloaded)
        // update the react native view
        self.reactNativeView.showOnlyDownloaded = showOnlyDownloaded
      },
      onNavigateToBookmark: { bookmark in
        // do the navigating
      }
    )
  }
}
```

### Java

```java
public class BookmarksViewController extends ViewController {
  private BookmarksView mReactNativeView;

  ...

  @Override
  public View loadView() {
    mReactNativeView = new BookmarksView(
      initialBookmarks,
      showOnlyDownloaded,
      (showOnlyDownloaded) -> {
        // actually change the setting somewhere
        this.handleShowOnlyDownloaded(showOnlyDownloaded);
        // update the react native view
        this.reactNativeView.setShowOnlyDownloaded(showOnlyDownloaded);
      },
      (bookmark) -> {
        // do the navigating
      }
    )
    return mReactNativeView;
  }
}
```

# What's required for this to be a reality?

- make a `mobile-shared-views` repo, hook it up
- work out the details of java & swift packaging for react-native and the
  supporting react-native-codegen files
- make the generated swift class a `UIView(Controller?)` and the generated
  java class a `View`, and establish solid conventions around lifetimes &
  usage.
- fill out the codegenning to support all the types of data we want to pass
  (arrays, enums/sum types)
- figure out internationalization
- make it so that updating properties on the swift & java react native classes
  flushes the new properties to javascript (requires a change to react-native
  for the java side)

## Internationalization

From a usage standpoint, I imagine we use a `<$_>` jsx transform similar to
what we do in webapp. But where do the strings come from? Two possible places:

### from native
When the view is instantiated, native sends along a map of strings for the
current locale

- cons: potentially lots of data needs to be passed from native to js. will
  this be a problem?

### from js
All strings needed by react native are stored in the `mobile-shared-views`
repo, and the native side just passes in the locale name, and the javascript
already has all the strings it needs.

- cons: a larger bundle & memory cost, as javascript presumably needs to load
  all the locales into memory

