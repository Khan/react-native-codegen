/**
 * This is an example component meant to exercise the full range of
 * react-native-codegen's serializing & deserializing capabilities.
 *
 * @flow
 */

import React, {
    Text,
    View,
    // $FlowIgnore
} from 'react-native';

export type VideoDescription = {
    lastEdited: number,
    author: string,
    text: string,
};

export type Video = {
    uri: string,
    length: number,
    description: VideoDescription,
};

export type User = {
    id: number,
    name: string,
    isAdmin: boolean,
};

type Props = {
    user: User,
    currentVideo: Video,
    setVideo: (video: Video, count: number) => void,
    getNextVideo: (cb: (video: Video) => void) => void,
    getVideoForUser: (user: User, cb: (video: Video) => void) => void,
    onClose: () => void,
    onError: (message: string) => void,
};

class KitchenSink extends React.Component {
    props: Props;
    render() {
        return (
            <View>
                <Text>
                    {JSON.stringify(this.props)}
                </Text>
            </View>
        );
    }
}

export default KitchenSink;
