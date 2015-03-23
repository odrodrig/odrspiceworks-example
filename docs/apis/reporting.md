# Reporting Service

## Reports

### Requests

#### List reports

List all reports visible by the current authenticated user:

```js
card.services('reporting').request('reports'[, options])
```

##### Options

Name | Type | Description
-----|------|--------------
`public`|`boolean`| Return reports that are marked as public or not public.
`return_type`|`string`| Get all reports that return this type of object.  Can be either `Software`, `Device`, `User`, `Purchase`, `Ticket`, `Agreement`, `CloudService`, `MobileSoftware`, `MobileDevice`, `Peripheral`, `PeripheralInstances`, or `SQL` for custom SQL reports.
`created_at`|`object`([datetime range]) (/docs/CanvasAppApis.md#date-time-filtering)| Return reports created within the given range.
`schedule`|`object`| Return reports based on their schedule properties (see below).
`search`|`object`| Search fields: `summary`, `description`.  See [Searching](/docs/CanvasAppApis.md#searching) documentation for more information.

###### Schedule Options

The following properties can be used as filters within the `schedule` property.

Name | Type | Description
-----|------|--------------
`enabled`|`boolean`| Return reports that have a currently enabled schedule.
`start_schedule_at`|`object`(datetime range)| Return reports whose schedule begins within the given range.
`stop_schedule_at`|`object`(datetime range)| Return reports whose schedule ends within the given range.
`frequency`|`string`| Return reports that are scheduled with the given frequency.  Can be either `daily`, `weekly`, `monthly`, or `end_of_month`.

Note: All filters that accept a datetime range take a JSON object with at least one of the following keys:

Name | Type | Description
-----|------|--------------
`after` (optional)|`string`| Match all objects whose datetime field is `>=` the timestamp, provided in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`.
`before` (optional)|`string`| Match all objects whose datetime field is `<=` the timestamp, provided in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`.

##### Response
```js
{
  "meta": {
    "total_entries": 9,
    "page_count": 1,
    "per_page": 30,
    "current_page": 1
  },
  "reports": [...] // see below for report json example
}
```


#### Get a single report

```js
card.services('reporting').request('report', id)
```

##### Parameters

Name | Type | Description
-----|------|--------------
`id`|`integer`| The `id` of the report

##### Response

Example report (note all arrays have been reduced to a single example item)

```js
{
  id: 34,
  name: "All Purchases",
  description: "All purchase items",
  created_at: "2012-01-13T11:50:43-06:00",
  updated_at: "2015-03-08T23:11:22-05:00",
  last_run_at: "2015-03-08T23:11:22-05:00",
  return_type: "Purchase",
  public: false,
  schedule: {
    start_schedule_at: "2015-01-07T08:00:00-06:00",
    next_run_at: "2015-04-01T08:00:00-05:00",
    stop_schedule_at: "2015-02-01T12:42:41-06:00",
    frequency: "monthly",
    format: "pdf",
    enabled: true
  }
}
```

#### Run a report

Run a report and get the results.

```js
card.services('reporting').request('report:run', id)
```

##### Parameters

Name | Type | Description
-----|------|--------------
`id`|`integer`| The `id` of the report

##### Response

The results will always be returned in a single page.  Example results (note all
arrays have been reduced to a single example item).

```js
{
  "meta": {
    "total_entries": 3,
    "page_count": 1,
    "per_page": 3,
    "current_page": 1
  },
  "results": [
    {
      "name": "Crucial 128MB Module",
      "quantity": "1",
      "price": "$74.99",
      "total_price": "$74.99",
      "part_number": "308878-001-CT",
      "purchased_at": "2015-01-01T08:00:00-06:00",
      "purchase_order": "IT-123",
      "shipping_code": "TX1234",
      "received_at": "2015-01-07T08:00:00-06:00",
      "ticket_id": "6",
      "vendor_name": "Crucial",
      "purchased_for_name": "michaelb-mbp"
    }
  ]
}
```
