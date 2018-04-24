# State Design
State and reducers are broken up into pieces, like any other redux application.

* view
* data
* filter
* search

## Reference Data
A large amount of referece data is needed to power the views and all reference data should be sourced from the dynamics server. This means that all reference data fetches are asynchronous and all initialization code needs to reflect Promise's versus strict values.

## Initialization
All initialization occurs as part of starting the saga middleware. Since reference and other data is asynchronous, initialization sagas are started when the component loads into the browser and prior to react component mounting. The view may refresh during initialization but it should not be too noticeable by the user.

## Item Processing
ActivityItem is the target in-memory data representation. Dynamics activities and annotations are conformed to this structure.

Item processing is strucured as sagas. There are two core "fetch" and "consolidate into buffer" messages in middleware.ts. They are only a dozen lines each as they mostly call the data sources or apply processors to the list and place results into application state.

Item processing progresses in stages:

* Data is fetching. See datasources.
* Data sources return results. They are cached by data source name.
* All data source results are consolidated into a buffer.
* The buffer is processed with enhancers processors to produce a final displayble "activities" list.
   * Enhancers modify the item such as adding more content or fixing up content. This way, your datasources can return what they can in the ActivityItem format and they can be enhanced independently with additional information.
   * Processors typically sort and filter the list based on various criteria such as which user is selected, date and activity type filters.
   * A set of "always" processors are always applied. For example, the buffer is always deduped before placed into the "activites list."

Data sources should generally return as much data as they reasonably can in order to make in-client sorting/filtering faster.


## TODO
The fetch results are run through enhancers then consolidated. Perhaps a dedupe prior to the enhancers as there could be many duplicates if the datasource results overlap.