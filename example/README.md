# Example App - `react-native-location`

In order to install this app, clone the repo and:

```
yarn install
```

The example app makes some assumptions about usage. The always usage permission is immediately requested, the app starts tracking location events immediately, and uses a distance of 5 meters as a gap.

![Example app video](../screenshots/example.gif)

## Developing the library with this Example
Normally, after a code change to `react-native-location` `src` files, you must remove the `node_modules/react-native-location` directory and `yarn install`. This is because the react-native packager won't follow symlinks.

To assist development, this command watches and rsyncs changes:

```
yarn sync-rnl
```

Leave a terminal open running this command when running the Example app and making `react-native-location` `src` changes. NOTE: This may run for a long time on first execution.
