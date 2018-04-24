# dynamics-client-ui-react
A UI library of components that can be used as-is or customized through
development. The components are written using react and office-fabric-ui-react
and offer extensive customization features. They are designed to be used by
developers assembling a solution vs a solution-in-a-zip file.

The library is designed to help improve the "360 degree view" of core dynamics
entities such as contacts, accounts and opportunities.

## Components

* CustomerAddress: Flexible customer address WebComponent to allow you to add
  addresses to other entities. It can also copy address fields into the target
  entity so they are cached for searching or use. This component does not solve
  the rather unfortunate address problem in dynamics in general. There have
  always been alot of published parts-of-solutions for this using select boxes
  but this WebComponent is designed to be a fully realized solution available to
  anyone. The "copying" behavior can be customized without coding.
* ActivitiesReader: An advanced activities reader. If you have relationship
  heavy sales & marketing processes, this can really help plough through or
  study activities and their content with much greater ease. You can customize
  the datasources that bring in related activities, for example, by obtaining
  activities that are connected to an entity using connections vs parent-child
  relationships. There are several datasources included.
* ActivitiesCalendar: An "office manager" calendar showing activties on a
  calendar. You should use the exchange calendar or something else if you need
  simple calendaring. If you need to show hundreds or thousands of calendar
  entries in a given month or week, use this calendar.
* Relativity: Show relationships in a hierachical tree with relationship
  labels. You can add any relationship to the hierarchy as long as you can write
  a datasource for it. Default datasources are included out of the box for most
  relationships. It is designed to show a large amount of relationships. The
  relationship graphing tool built into dynamics is rather limited. This does
  not show a diagram (TBD) but a structure like a folder-file hierarchy. You can
  customize the existing datasources or write your own. Several are included
  with the default component.
* AddressManager: An entity specific Web Resource that provides a more modern, although not perfect, address editor. It uses a master-detail view to edit the 2 "empty" addresses allocated with every contact and address as well as add/remove other addesses. Some hooks allow you to establish callbacks that run variousu code when an address changes as you may have entities that link to addresses but do not have a lookup relationship due to the extreme poorly designed address capabilities in CRM. The view is easily customized so you can dropdowns and such for specific fields, such as state or country, to enforce data integrity.

## Using
The components are designed to mostly help developers create better user and customer experiences. You can use the components by accessing the "vanilla" views in the component directories. You can bundle them using your javascript bundler of choice, such as webpack.

```javascript
const config = {
  entry: {
    RelativityViewDefault: path.resolve("./node_modules/@aappddeevv/dynamics-client-ui-react/lib/components/Relativity/RelativityView"),
  }
}
```

To use in dynamics, create a view with a web resource and add the bundler output as a script element. Then call `RelativityViewDefault.run(...args...)` in the body. You can also run them directly by using the react shim and setting the `targeturl` property to the location of the loaded js webresource file. (see below).

The vanilla views are not, by default, customizable by specifying a json web resource file or a dynamics configuration record, but you do that easily in your `.html` driver file and call run with the customized parameters of your choice.

### Using the SHIM files
If you want to use the "react_shim.html" web resource and directly load the component, or just seen an example of setting up dedicated functionality for shimming, use the shim files in the component directories. The "react_shim.html" can directy load any javascript file and run the shim itself but the dedictaed shim file makes it easier. Add an entry to our web bundler like above but choose the "Shim" file. As descibed above, the shim file simple calls the view's "run" method with the shim container HTML element. It uses *all* default parameters.

You you can add custom run parameters directly in react_shim's "data's" parameters in a specific form's form properties.

"react_shim.html" is located in this project at "public/react_shim.html". Your build process can copy this file from the install folder to your chose location, typically "new_/react_shim.hmtl" where new_ is your specific publisher.

## Development Support
A react shim is provided that allows you to load components easily or to preform
hot load development as you work through customizations of the above components.

More details on the shim and programming dynamics in general is located at [this book](https://www.gitbook.com/book/aappddeevv/advanced-dynamics-crm-development/details).

## Technologies
Many of the components use redux to manage state.

* react
* redux
* typescript
