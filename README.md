# dynamics-client-ui

A set of packages to help developers build great dynamics user interfaces.

* [dynamics-client-ui](./packages/dynamics-client-ui/README.md): A basic set of
  utilities and components.
* [dynamics-client-ui-react](./packages/dynamics-client-ui-react/README.md): A set of
  react components to support 360-degree views of customers. The components use
  office-fabric-ui-react.
* [experiments](./packages/experiments/README.md): Experiments, WIP.

The monorepo is a WIP although some packages have been published to the npm registry.


## Building
This is a monorepo relying on [rush](https://github.com/Microsoft/web-build-tools) to support multi-module builds. To build, first install rush then:

```sh
rush install
rush rebuild
```
