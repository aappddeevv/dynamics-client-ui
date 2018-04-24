BuildSettings exports required for proper compilation include:

* DEBUG, boolean: true or false: whether debug console messages in the browser should be printed. Setting this to true may slow the application down.
* CLIENT, string: UNIFIED, WEB or MOBILE. You should really dynamically determine this. See `Dynamics.Utils.isUci`.
* BUILD, string: PROD, DEV or TEST

You can define these in webpack using alias. A `BuildSettings.sample.ts` is provided in this directory as an example. Define these in your build tool. Most build tools as well as typescript allow you to "remap" module names to specific files. Webpack has `module.alias` and typescript has `compileOptions.path`.

You may have additional build settings in your application. You can add your build setting variables to the same BuildSettings in your own build settings module definition but make sure you include the ones above i.e.
```typescript
export const DEBUG: string = true
export const CLIENT: string = "WEB"
export const BUILD: string = "PROD"
export const API_KEY: string = "1234"
```
