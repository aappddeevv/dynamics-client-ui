# dynamics-client-ui

A library to help you create great dynamics applications and user interfaces.

## What is it?

A library containing utilities and UI components, written in typescript and react but directly usable from javascript.

Some parts:

* Robust web api client and data management interfaces proven in multiple applications.
* Robust metadata client, caching.
* Dynamics react wrapper component, provides an XRM, user message notifier and other
  supporting components
* EntityForm react wrapper component, acts like a redux store. Supports "new"
  and "existing" form control.
* EventBus for coordinating different web components in a master-detail fashion.
* FormContextHolder to properly obtain a form context and make it available to
  WebResources.
* HTML traditional/UCI UI utilities to help your UI work in any environment
* SortedDetailsList react components for displaying tabular data nicely. Based
  on office-fabric-ui-react.
* Misc react components for UI construction
* Redux combineReducers that provides the full state to all reducers.
* ...and more...

## Using
Install using npm:

```sh
npm install install --save @aappddeevv/dynamics-client-ui
```

If you wish to use the library in development mode, just link it with npm.  The
library build is still under construction but it is usable if you use npm
link. After cloning:

```sh
cd dynamics-client-ui
npm run build
npm link
cd ../yourapp
npm link dynamics-client-ui
```

The library does creates a typescript parsed output distribution so you can use
the module like any other.

Transpiling down to js/.d.ts files is quite popular, but I am not sure that's
the best way to publish if you *assume* that the consumers are all using
typescript. It may be critical to transpile CSS files though into something more
digestable so that you do not need to use the same CSS loader bundling
configuration as dynamics-client-cli. There are some `office-fabric-ui-react`
building blocks as well, for example, providing a sortable, nice looking
`DetailsList` you can use to list and interact with data in a master-detail
interaction model.

You will need to define the module `BuildSettings` to be a module that exports a
few constants. See config/README.md for details.

The CSS is currently written using cssnext. If you use webpack for bundling, the
postcss configuration that should work is:

```javascript
const finalStyleLoaders = [
    { loader: "style-loader" },
    { loader: "css-loader", options: { modules: true, importLoaders: 1 } },
    { loader: "postcss-loader",
      options: {
          ident: 'postcss',
          plugins: (loader) => [
              require("postcss-import")({root: loader.resourcePath}),
              require("postcss-mixins")(),
              require("postcss-cssnext")(),
              require("postcss-reporter")({clearMessages: true}),
          ] }}
]
```

I mention this because most libraries give you a single version of CSS to use or
pass along the LESS/SCSS files. Using this loader is the equivalent of providing
you the sources.

# Documentation
I am working on publishing API documentation but am not quite there yet.
