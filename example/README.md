## Example App

![Example app video](../screenshots/example.gif)

Normally, after a code change to react-native-location src files,
you must remove the node_modules/react-native-location directory
and npm install.  The react-native packager won't follow symlinks.

To assist development, this command watches and rsyncs changes:

```
npm run sync-rnl
```

Leave a terminal open running this command when running the Example
app and making react-native-location src changes. NOTE: This may
run for a long time on first execution.
