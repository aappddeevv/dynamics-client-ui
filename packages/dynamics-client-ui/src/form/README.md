Short scripts designed to run as event handlers in forms or help you develop
your form scripts.

The scripts in this directory use ES2015 modules so you need to use a bundler to
bundle them for deployment. If you use webpack, you can include an individual
script by just referencing the actual file as your entry point in your project's
webpack configuration and output it directly. Or you can included it via imports
in your javascript bundles.

* EventBus: Communicate among clients that an event occurred. This is good for
  distributing the selection of a grid to multiple listeners (detail screens) on
  the same form.
* FormContextHolder: Add this as a form script and initialize the context holder
  once you receive the form context as the parameter. Clients waiting for the
  Promise to complete can be assured that it has a valid Xrm.FormContext.
* FormLibrary: Useful functions when writing script at the form level.
* FormRulesEngine: WIP. Ignore this for now.
