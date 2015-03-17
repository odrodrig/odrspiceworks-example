# API Basics

## Creating a Card

In order to access any of the Cloud App APIs, you first must create a `Card`
instance inside of your App.  The `SW` global namespace will be used for all
Spiceworks-related APIs, including the `Card` constructor:

```js
var card = new SW.Card();
```

Once you've created a Card object, you can use the card to make requests and
respond to events from Spiceworks.

## Card Lifecycle

When an App Card is first loaded inside of Spiceworks the `activate` event will
be fired.  Your App can respond to the `activate` event by passing a callback to
the `onActivate` method:

```js
var card = new SW.Card();
card.onActivate(function(envData){
  // do any app setup or configuration
});
```

Your callback function will receive a single argument that is an object
containing data about the environment in which your Card was loaded.
See [Environment
Service](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/apis/environment.md)
for more detail.

## Card Services

The Canvas App APIs are divided into groups called `services`.  Each service
provides its own scope within Spiceworks.  For example, the `helpdesk` service
provides your app access to read and write  user data related to the Spiceworks
Helpdesk.  When a Spiceworks user downloads your app, they can decide whether to
give your app access to each service.

To access a service, simply call the `Card#services` method and pass in the name
of the service you want, e.g.:

```js
var card = new SW.Card();
card.services('helpdesk');
```

The `services` method will then return a `CardService` object that responds to
requests.  For a full list of the available services see [Canvas App
Services](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/apis/helpdesk.md).

### Date Time Filtering

The date time filter allows you to specify a range of dates and times to search for
across a set of model fields.  For example, if you want to find all tickets
that were created before March, you would write:

```js
var card = new SW.Card();
card.services('helpdesk').request('tickets', {created_at: {before: '03/01/2015'}})
```

Note: All filters that accept a datetime range take a JSON object with at least one of the following keys:

Name | Type | Description
-----|------|--------------
`after` (optional)|`string`| Match all objects whose datetime field is `>=` the timestamp, provided in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`.
`before` (optional)|`string`| Match all objects whose datetime field is `<=` the timestamp, provided in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`.

Some more examples:

All devices that were `last_scanned` after January 5th, 2015:

```js
var card = new SW.Card();
card.services('inventory').request('devices', {last_scanned_at: {after: '01/05/2015'}})
```

All reports that were `created_at` between January 5th, 2015 and March 5th, 2015:

```js
var card = new SW.Card();
card.services('reporting').request('reports', {created_at: {after: '01/05/2015', before: '3/05/2015'}})
```

## Requests

Each service will respond to a specific set of API requests.  To make a request
to a service, you simply call the `CardService#request` method.  For example if
you wanted to get the list of tickets for the current user, you simply request
`tickets` from the `helpdesk` service:

```js
var card = new SW.Card();
card.services('helpdesk').request('tickets').then(function(data){
  console.log(data);
});

/* prints to the console:
 * {
 *   meta: {...},
 *   tickets: [...]
 * }
 *
 */
```

Requests will always return a response from the service.  Services will respond
asynchronously with a promise object that responds to a method `then`, as
defined by the [Promises/A+](http://promises-aplus.github.com/promises-spec/)
specification.

### Parameters

Requests can also handle arguments that help fulfill a request.  For instance,
to get a single ticket from the `helpdesk` service, you must include a ticket
`id` with the `ticket` request:

```js
var card = new SW.Card();
card.services('helpdesk').request('ticket', 2)
  .then(function(ticket){
    // do something with the ticket...
  });
```

All requests accept a final, optional parameter that specifies options to the
request method.  For example, the `tickets` request allows you to optionally
filter the list of tickets returned.  So, if you wanted just the list of
currently open tickets, you could write the following:

```js
var card = new SW.Card();
card.services('helpdesk').request('tickets', { status: 'open' })
  .then(function(data){
    // do something with tickets...
  });
```

For a full list of the supported requests for a service visit the [service
documentation
page](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/apis/helpdesk.md).

### Searching

Like in the open tickets example above, requests that return a collection of
resources support filtering the collection by the exact values of the model
attributes.  Some requests also support a special, additional `search` filter
for filtering by the values of the model attributes with inexact matching.

The `search` filter allows you to specify a set of substrings to search for
across a set of model fields.  For example, if you want to find all open tickets
that contain the word 'keyboard' in either their `summary` or `description`
fields, you would write:

```js
var card = new SW.Card();
card.services('helpdesk').request('tickets', {
  status: 'open',
  search: {
    query: {
      terms: ['keyboard']
    },
    fields: {
      names: ['summary', 'description']
      operator: 'or'
    }
  }}).then(function(data){
    // do something with tickets...
  });
```

The `search` filter requires an object with two properties, `query` and
`fields`.  Both the `query` and `fields` properties are also objects.

The `query` object contains two properties:

Name | Type | Description
-----|------|--------------
`terms`|`array`| **Required**. The list of substrings that you want to find in model attributes.
`operator`|`string`| The boolean operator that you want to use when searching for the set of `terms`. Can be `and` or `or`.  Default: `or`.

If you use the `or` operator in the `query` object, the search will return
models whose fields match at least **ONE** of the `terms` in your search.  If
you use the `and` operator it will only return results with fields that contain
**ALL** the terms in your search.

The `fields` object also contains two properties:

Name | Type | Description
-----|------|--------------
`names`|`array`| **Required**. The list of model field names that you want to search across.
`operator`|`string`| The boolean operator that you want to use when searching across fields. Can be `and` or `or`.  Default: `or`.

If you use the `or` operator the search will return objects that match your
query in at least **ONE** of the `fields` in your search.  If you use the `and`
operator, it will only return results that have your query in **ALL** fields.

Some examples:

All tickets with the words 'Microsoft' and 'keyboard' in their `summary` field:

```js
card.services('helpdesk').request('tickets', {
  search: {
    query: {
      terms: ['Microsoft', 'keyboard'],
      operator: 'and'
    },
    fields: {
      names: ['summary']
    }
  }})
```

All tickets with either the word 'mouse' or 'keyboard' in their `summary`:

```js
card.services('helpdesk').request('tickets', {
  search: {
    query: {
      terms: ['mouse', 'keyboard'],
      operator: 'or'
    },
    fields: {
      names: ['summary']
    }
  }})
```

All tickets with the word 'mouse' in both their `summary` and their
`description`:

```js
card.services('helpdesk').request('tickets', {
  search: {
    query: {
      terms: ['mouse']
    },
    fields: {
      names: ['summary', 'description'],
      operator: 'and'
    }
  }})
```

### Paging

Requests that return multiple items will be paginated.  The pagination will keep
from returning too many items at once, which can slow down your app or the
Spiceworks server.

For paginated requests, you can request a specific page of results.  For some
paginated requests, you can also specify the number of results per page.  To set
these parameters pass them to the `request` function as keys in the final
options argument.

For example, if you wanted the second page of currently open tickets with 50
tickets per page you would write:

```js
var card = new SW.Card();
card.services('helpdesk').request('tickets', { status: 'open', page: 2, per_page: 50 })
```

If you do not pass in a `page` value, then a request will always return the
first page (page `1`) of results.  Different resources will have a different
default `per_page` value and may have different limits.  See the specific
request documentation for more information on the `per_page` defaults.

When a paginated request is returned, it will always have a top-level `meta`
attribute containing pagination information.  For example:

```js
"meta": {
  "total_entries": 205, // total number of items, across all pages
  "page_count": 7, // total number of pages
  "per_page": 30, // number of items per page
  "current_page": 2 // the current page number
}
```

## Events

In addition to responding to requests, every API service will keep your App up to date on
changes inside of Spiceworks.  When a change occurs relating to a service, it
will send your App an `event`.  Your App can listen for these events and
register event handlers to respond to the changes using the `CardService#on`
method.

Suppose you were creating an App that displayed information on a Spiceworks Help
Desk ticket.  To update the view in your App when a new ticket is shown on the
Spiceworks Help Desk you could use the following:

```js
card.services('helpdesk').on('showTicket', function(ticketId){
  // update your App for the new ticket with id ticketId
});
```

The `on` method always takes the name of the event you are listening for and a
callback that will handle the event.  The parameters passed to the callback will
vary depending on the event, so see the relevant service API reference for more
information.

## Error Handling

Your app should gracefully handle errors returned by a request.  Since all
requests return a promise object, this simply means providing an error handler
to the `then` function:

```js
var card = new SW.Card();
card.services('helpdesk').request('tickets')
   .then(undefined, function(errors){
    // handle errors
   });
```

 When an error occurs on a request, the promise will be rejected with an object
containing a list of error objects.  For instance, in the previous example if
your app did not have access to the `helpdesk` service, the promise would be
rejected with the following object:

```js
{
  errors: [{
    title: 'Connection Error',
    details: 'Could not connect to service helpdesk. Make sure the service name is correct and that your App has access to this service.'
  }]
}
```
