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
`priority`|`string`| Return tickets with this priority. Can be either `low`, `medium`, or `high`.
`site`|`integer`| Return tickets from this site.  Must be the site `id`.
`sort`|`string`| How to sort the results.  Can be either `updated`, when the ticket was last updated, or `created`, when the ticket was created.  Default: `created`
`status`|`string`| Return tickets with this status. Can be either `open` or `closed`.
`status_updated_at`|`object`(datetime range)| Return tickets whose status was last changed within the given range.
`viewed_at`|`object`(datetime range)| Return tickets that were last viewed within the given range.

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

```js
{
  "id": 6,
  "summary": "My email is not working.",
  "status": "open",
  "priority": 3,
  "description": "I can't login to my email account.",
  "due_at": "2014-11-07T17:00:00-06:00",
  "created_at": "2012-02-16T16:22:13-06:00",
  "updated_at": "2014-11-11T15:08:18-06:00",
  "closed_at": null,
  "viewed_at": "2014-11-11T15:08:14-06:00",
  "reopened": null,
  "muted": null,
  "category": "",
  "site_id": 1,
  "master_ticket_id": null,
  "reported_by_id": null,
  "time_spent_duration": "1h",
  "shared": true,
  "creator": {
    "id": 159,
    "first_name": "Michael",
    "last_name": "Gerbush",
    "role": "admin",
    "department": "DEV",
    "avatar_path": null,
    "url": "http://localhost:9675/people/159"
  },
  "assignee": {
    "id": 159,
    "first_name": "Michael",
    "last_name": "Gerbush",
    "role": "admin",
    "department": "DEV",
    "avatar_path": null,
    "url": "http://localhost:9675/people/159"
  },
  "users": [
    {
      "id": 159,
      "first_name": "Michael",
      "last_name": "Gerbush",
      "role": "admin",
      "department": "DEV",
      "avatar_path": null,
      "url": "http://localhost:9675/people/159"
    }
  ],
  "comments": [
    {
      "attachment_content_type": null,
      "attachment_location": "/Users/michaelg/src/desktop/data/uploads/Ticket/6/1-",
      "attachment_name": null,
      "comment_type": "response",
      "created_at": "2014-11-07T17:17:44-06:00",
      "updated_at": "2014-11-07T17:17:44-06:00",
      "id": 1,
      "is_inventory": false,
      "is_labor": null,
      "is_public": true,
      "is_purchase": false,
      "remote_id": null,
      "ticket_id": 6,
      "creator": {
        "id": 1,
        "first_name": "Tim",
        "last_name": "Gittos",
        "role": "admin",
        "department": "DEV",
        "avatar_path": null,
        "url": "http://localhost:9675/people/1"
      },
      "collaborator": null,
      "body": "Working on resetting your password."
    } // ...
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
      "id": 128,
      "name": "michaelg-mbp",
      "type": "Device",
      "product_info": {
        "avg_rating": null,
        "category": null,
        "collected_at": "2013-06-22T16:57:13-05:00",
        "community_product_id": 37338,
        "description": null,
        "id": 8,
        "image_url": "//static.spiceworks.com/images/products/0007/5850/macbook_pro_profile.jpg",
        "model_name": "MacBook Pro",
        "rating_count": null,
        "vendor_name": "Apple"
      },
      "show_url": "/inventory/groups/devices/128",
      "can_troubleshoot": true,
      "recent_tickets": 0,
      "tickets_this_year": 0
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
