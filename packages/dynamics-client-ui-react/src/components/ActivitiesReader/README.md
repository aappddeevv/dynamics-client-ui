# Usage

* Import redux/middleware. Add it to the apps overall middleware and call start() to start the component's middleware.
* Import the redux/reducers and combine them with the apps overall reducers.
* Use the redux Provider component to ensure that a store named "store" (the default) is available in the context.
* Place an ActivitiesViewComponent in your component tree.

There are additional optional customizations you can perform:
* Create an ActivitiesViewComponent using redux's connect to add any state=>props or dispatch=>props to ensure data is available to any subcomponents/menus you have added.
* Pass in any customizations via props to the ActivitiesViewComponent e.g. additional menu items, turn off displaying the header or footer, more display "controls."
* Add or change the data sources.


# Data Sources
Activities/annotations can come from multiple places including:

* Navigation property:
  * Navigate from the entity to activitypointers
  * Appears to only pull in activities with regarding=entity
* ActivityParties:
  * Scan activityparty table for partyid = entityid.
  * Allows you to select regarding, cc, and other types of participation masks
* Connections:
  * For activities (1, left) to entity (2, right)
* Rollup
  * For eligible parents, roll-up activities.
  * May only apply to accounts and contacts
  * Not clear if this available via a navigation property.
  
Annotations are very similar:
* Annotations directly attached via objectid = entityid
* Rollup
  * You could choose to roll-up notes from any related object.
  
Given all these choices and potentially more, you need to ensure that you manage
the data sources and that each data source standardizes the data for displaying
in the component. See the data directory for more details.
