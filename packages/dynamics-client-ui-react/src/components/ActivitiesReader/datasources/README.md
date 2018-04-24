# Datasource Design

Data sources are designed as async iterators that return effects for
react-saga. DAO's underneath each datasource are responsible for the actual data
fetch. Initialization is handled through a factory model. A data source
represents a specific way that "activities" can be attached to an entity
e.g. directly, through a child entity, or through connections. You can return
data from a data source in the target data model or you can add an enhancer to
automatically convert it. Data sources are run in parallel and have no knowledge
of each other, hence, they return usually return duplicates. The final list to
display in the component is automatically deduped.

When data as needed a `FetchContext` is created that contains some smart
constructors and misc state data needed to perform the fetch. The returned type
should be `Result` which is a monadic co-product, either an error'ish object or
the returned results.

Each datasource is buffered. Each datasource buffer is aggregated with the other
buffers and that buffer is deduped and processed with "enhancers" and
"processors" that enhance the returned data so that it conforms to the proper
target UI data model, an `ActivityItem`.  Upon filtering or other UI requests to
manipulate the data and hence the set of processors applied to the data, the
datasource buffers go through the same processing again e.g. the processors list
may have a "filter on lastname" added. Once the processing is done, the final
item list is set into the application state and displayed in the UI.

Several datasources to obtain activities for a specific target entity (such as
contact or account) are provided. You can write your own and aggregate the
default with the new datasource to create the set of sources for a specific
application.

State specific to a data source can be easily composed into the overall redux
store and accessed within a saga or a data source can manage its own state using
a different non-UI related state manager.

An item's data model can be enhanced so that it contains additional data that a
specific extension needs for filtering, displaying, etc. These types of
enhancers can be run as sagas that watch for specific actions. You can think of
the enhancers as workers that continuously monitor for "new" data, enhance it,
then returns it so it can be added to the final list of data to be used by the
component. Because the enhancers may need to run in a specific order, there is
an overall saga that an enhancer saga must plug into in order to be run
correctly.


## Fetch Processing Using a Datesource
A datasource must ensure that it has all the information needed to run. Since a
datasource is a saga, it can examine application state and look for the parameters
it needs. Yes, this is not very IOC, but since you can add datasources that do
funky things, this makes it easier to write the framework. If there is insufficient
state to retrieve data, a datasource should return an empty result although at
its discretion it can also return an error.

Fetch status, by datasource name, is stored in state data.fetchStatus. Once the fetch
completes, the results are stored, by datasource name, in state data.fetchResult.