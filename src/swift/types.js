/**
 * Types that are specific to the swift generation.
 *
 * @flow
 */

export type MarshallingMethods = {
    serialize: {[swiftName: string]: string},
    deserialize: {[swiftValueToJson: string]: string}
}
