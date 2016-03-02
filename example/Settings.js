/**
 * This is an example component that takes some callbacks but doesn't use any
 * custom object types.
 *
 * @flow
 */

import React, {
    Text,
    View,
    // $FlowIgnore
} from 'react-native';

type Props = {
    shouldShowLogOutButton: boolean,
    availableDiskSpaceInBytes: number,
    onlyDownloadOverWifi: boolean,
    checkAnswer: (answer: string, cb: (isCorrect: boolean) => void) => void,
    onSignOut: () => void,
    onFeedbackNav: () => void,
    onSetDownloadOverWifi: (downloadOverWifi: boolean) => void,
};

const styles = {
    title: {
        fontSize: 10,
        marginTop: 100,
    },
    container: {
        backgroundColor: '#aaf',
        alignItems: 'center',
        flex: 1,
    },
};

class Settings extends React.Component {
    props: Props;
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>
                    {JSON.stringify(this.props)}
                </Text>
            </View>
        );
    }
}

export default Settings;
