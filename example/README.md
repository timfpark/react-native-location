# Example App - `react-native-location`

In order to install this app, clone the repo and:

```
yarn install
```

The example app makes some assumptions about usage. The always usage permission is immediately requested, the app starts tracking location events immediately, and uses a distance of 5 meters as a gap.

![Example app video](../screenshots/example.gif)

## Developing the library with this Example
Run the packager using `yarn run:packager` from the root directory.

Babel is configured to find `react-native-location` from the `dist` directory. If you make a change to the Javascript in `src` you need to run `yarn build` for the example app to find the new code.
