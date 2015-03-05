# Helpdesk Service

## Tickets

### Requests

#### List tickets

List all tickets visible by the current authenticated user:

```js
card.services('helpdesk').request('tickets'[, options])
```

##### Options

Name | Type | Description
-----|------|--------------
`assignee`|`integer` or `string`| Return tickets that are assigned to this user.  Can be either a user `id` or the string `none` for unassigned tickets.
`author`|`integer`| Return tickets authored by this user. Must be the user `id`.
`closed_at`|`object`(datetime range)| Return tickets closed within the given range.
`created_at`|`object`(datetime range)| Return tickets created within the given range.
`due_at`|`object`(datetime range)| Return tickets whose due date is within the given range.
`page`|`integer`| The page offset.  Must be between `1` and `page_count`.  Default: `1`
`per_page`|`integer`| Number of entries per page. Must be between `1` and `100`.  Default: `30`
`priority`|`string`| Return tickets with this priority. Can be either `low`, `med`, or `high`.
`site`|`string`| Return tickets from this remote site.
`sort`|`string`| How to sort the results.  Can be either `updated`, when the ticket was last updated, or `created`, when the ticket was created.  Default: `created`
`status`|`string`| Return tickets with this status. Can be either `open` or `closed`.
`status_updated_at`|`object`(datetime range)| Return tickets whose status was last changed within the given range.
`viewed_at`|`object`(datetime range)| Return tickets that were last viewed within the given range.
`search`|`object`| Search fields: `summary`, `description`.  See [Searching](/docs/CanvasAppApis.md#searching) documentation for more information.

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
  "tickets": [...] // see below for ticket json example
}
```


#### Get a single ticket

```js
card.services('helpdesk').request('ticket', id)
```

##### Parameters

Name | Type | Description
-----|------|--------------
`id`|`integer`| The `id` of the ticket

##### Response

Example ticket (note all arrays have been reduced to a single example item)

```js
{
  "id": 53,
  "show_url": "/tickets/list/single_ticket/53",
  "summary": "Keyboard issue",
  "status": "closed",
  "priority": 1,
  "description": "My keyboard is growing mold on it, ned new one.",
  "due_at": null,
  "created_at": "2015-02-08T22:48:46-08:00",
  "updated_at": "2015-02-18T22:48:46-08:00",
  "closed_at": "2015-02-17T22:48:46-08:00",
  "viewed_at": null,
  "reopened": false,
  "muted": null,
  "category": "",
  "master_ticket_id": null,
  "time_spent_duration": "0m",
  "shared": false,
  "creator": {
    "id": 11,
    "first_name": "Chris",
    "last_name": "Habanero",
    "role": "end_user",
    "department": null,
    "avatar_path": null,
    "show_url": "/people/11"
  },
  "assignee": {
    "id": 2,
    "first_name": "Mark",
    "last_name": "Jalapeno",
    "role": "admin",
    "department": "IT",
    "avatar_path": null,
    "show_url": "/people/2"
  },
  "remote_src": {
    "site": null,
    "collector": null
  },
  "users": [
    {
      "id": 2,
      "first_name": "Mark",
      "last_name": "Jalapeno",
      "role": "admin",
      "department": "IT",
      "avatar_path": null,
      "show_url": "/people/2"
    }
  ],
  "comments": [
    {
      "attachment_content_type": null,
      "attachment_name": null,
      "comment_type": "response",
      "created_at": "2015-02-18T22:48:46-08:00",
      "updated_at": "2015-02-18T22:48:46-08:00",
      "id": 70,
      "is_inventory": false,
      "is_labor": null,
      "is_public": true,
      "is_purchase": false,
      "remote_id": null,
      "ticket_id": 53,
      "creator": {
        "id": 2,
        "first_name": "Mark",
        "last_name": "Jalapeno",
        "role": "admin",
        "department": "IT",
        "avatar_path": null,
        "show_url": "/people/2"
      },
      "collaborator": null,
      "body": "Ticket closed."
    }
  ],
  "c_alert_level": "orange",
  "custom_attrs": [
    {
      "name": "c_alert_level",
      "label": "Alert Level",
      "value": "Orange",
      "type": "enum"
    }
  ],
  "alerts": [
    {
      "id": 5052,
      "message": "Due 4 days ago"
    }
  ],
  "inventory_items": [
    {
      "id": 642,
      "show_url": "/inventory/groups/devices/642",
      "name": "embarrassed-dugong",
      "type": "Device",
      "product_info": {
        "description": null,
        "image_url": "//h10003.www1.hp.com/digmedialib/prodimg/lowres/c03889640.jpg",
        "model_name": "ProBook 650 G1",
        "vendor_name": "Hewlett-Packard",
        "avg_rating": null,
        "rating_count": null,
        "category": null
      },
      "can_troubleshoot": true,
      "recent_tickets": 1,
      "tickets_this_year": 1
    }
  ],
  "purchases": [
    {
      "id": 2,
      "name": "Crucial 128MB Module",
      "purchased": false,
      "price": 74.99,
      "product_image": "http://webobjects2.cdw.com/is/image/CDW/225027",
      "part_number": "308878-001-CT"
    }
  ],
  "work": [
    {
      "id": 1,
      "time_spent": 3600,
      "rate": 50.0,
      "labor": 50.0,
      "user": {
        "id": 159,
        "first_name": "Michael",
        "last_name": "Gerbush",
        "role": "admin",
        "department": "DEV",
        "avatar_path": null,
        "url": "http://localhost:9675/people/159"
      }
    }
  ],
  "collaborations": [
    {
      "id": 1,
      "status": "Pending",
      "created_at": "2014-11-07T18:06:47-06:00",
      "updated_at": "2014-11-07T18:06:47-06:00",
      "collaborator": {
        "id": 2,
        "public_name": "spicerex",
        "url": "http://localhost:9675/people/2",
        "first_name": "Spice",
        "last_name": "Rex",
        "avatar_path": null,
        "role": "collaborator"
      }
    }
  ]
}
```

#### Create a ticket

Create a ticket with the given parameters

```js
card.services('helpdesk').request('ticket:create', attributes)
```

##### Attributes

Name | Type | Description
-----|------|--------------
`summary`|`string`| **Required**.  A short description of the request.
`description`|`string`| Full description of the request.
`assignee`|`integer`| The IT Pro the ticket is assigned to.  Must be an IT Pro `id`.
`priority`|`string`| The priority of the request. Must be `low`, `med`, or `high`.  Default: `med`.
`due_at`|`string`| Due date of the request.  Must be a timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`.
`status`|`string`| The current status of the request. Must be `open` or `closed`.  Default: `open`.

##### Response

This request will return the created ticket JSON, see the [single ticket response](#response-1).

#### Update a ticket

Update a ticket with the given parameters

```js
card.services('helpdesk').request('ticket:update', id, attributes)
```

##### Parameters

Name | Type | Description
-----|------|--------------
`id`|`integer`| The `id` of the ticket
`attributes`|`object`| See below for detailed requirements

##### Attributes

Name | Type | Description
-----|------|--------------
`summary`|`string`| **Required**.  A short description of the request.
`description`|`string`| Full description of the request.
`assignee`|`integer`| The IT Pro the ticket is assigned to.  Must be an IT Pro `id`.
`priority`|`string`| The priority of the request. Must be `low`, `med`, or `high`.  Default: `med`.
`due_at`|`string`| Due date of the request.  Must be a timestamp in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`.
`status`|`string`| The current status of the request. Must be `open` or `closed`.  Default: `open`.

##### Response

This request will return the updated ticket JSON, see the [single ticket response](#response-1).

### Events

#### Show ticket

Fired after a new ticket is rendered inside the Spiceworks Help Desk.

```js
card.services('helpdesk').on('showTicket', handler)
```

##### Hanlder arguments

Name | Type | Description
-----|------|--------------
`id`|`integer`| The id of the ticket that was rendered.
