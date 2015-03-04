# People Service

People tracked in Spiceworks are typically regular employees of the organization
supported by the IT Pro. The people service provides access to information about
these users, their devices, any support tickets they may have submitted, and so on.

## People

### Requests

#### List people

List all people (IT Pros and end users) in the system:

```js
card.services('people').request('people')
```

##### Response
```js
{
  "meta": {
    "total_entries": 166,
    "page_count": 6,
    "per_page": 30,
    "current_page": 1
  },
  "people": [...] // see below for person JSON example
}
```

#### Get a single person

```js
card.services('people').request('person', id)
```

##### Parameters

Name | Type | Description
-----|------|--------------
`id`|`integer`| The `id` of the person

##### Response

Example person (note all arrays have been reduced to a single example item):

```js
{
  "id": 13,
  "first_name": "Alexia",
  "last_name": "Rocoto",
  "role": "end_user",
  "department": "Finance",
  "avatar_path": "/images/icons/medium/person-avatar-restricted.png",
  "show_url": "/people/13",
  "title": "",
  "location": "",
  "start_date": null,
  "created_at": "2015-02-26T00:46:54-06:00",
  "updated_at": "2015-03-04T00:10:41-06:00",
  "supervisor": null,
  "tickets": {
    "creator": {
      "meta": {
        "total_entries": 1
      },
      "tickets": [
        {
          "id": 40,
          "show_url": "/tickets/list/single_ticket/40",
          "summary": "Computer issues",
          "status": "open",
          "priority": 2,
          "description": "My computer is crashing quite often and running rather slow",
          "due_at": "2015-02-25T11:42:27-06:00",
          "created_at": "2015-02-20T00:47:01-06:00",
          "updated_at": "2015-02-26T00:47:09-06:00",
          "closed_at": null,
          "creator": {
            "id": 13,
            "first_name": "Alexia",
            "last_name": "Rocoto",
            "role": "end_user",
            "department": "Finance",
            "avatar_path": "/images/icons/medium/person-avatar-restricted.png",
            "show_url": "/people/13",
          },
          "assignee": {
            "id": 2,
            "first_name": "Lucy",
            "last_name": "Chipotle",
            "role": "admin",
            "department": "IT",
            "avatar_path": "/images/icons/medium/person-avatar-admin.png",
            "show_url": "/people/2"
          }
        }
      ]
    },
    "cc": {
      "meta": {
        "total_entries": 7
      },
      "tickets": [
        {
          "id": 54,
          "show_url": "/tickets/list/single_ticket/54",
          "summary": "Relocation",
          "status": "open",
          "priority": 1,
          "description": "I am moving offices today and will need my computer moved when you can. I am in room 9.04 and am moving to 9.10.",
          "due_at": "2015-02-23T13:13:52-06:00",
          "created_at": "2015-02-21T00:47:04-06:00",
          "updated_at": "2015-02-27T03:12:36-06:00",
          "closed_at": null,
          "creator": {
            "id": 7,
            "first_name": "Rick",
            "last_name": "Hall",
            "role": "end_user",
            "department": null,
            "avatar_path": "/images/icons/medium/person-avatar-restricted.png",
            "show_url": "/people/7"
          },
          "assignee": {
            "id": 3,
            "first_name": "David",
            "last_name": "Rocoto",
            "role": "admin",
            "department": "IT",
            "avatar_path": "/images/icons/medium/person-avatar-admin.png",
            "show_url": "/people/3"
          }
        }
      ]
    }
  },
  "purchases": {
    "receiver": {
      "meta": {
        "total_entries": 1
      },
      "purchases": [
        {
          "id": 2,
          "show_url": "/purchases/2",
          "name": "mouse",
          "purchased": false,
          "received": false,
          "price": 45.0,
          "product_image": "",
          "part_number": "Nano VX"
        }
      ]
    }
  },
  "devices": [
    {
      "id": 14,
      "show_url": "/inventory/groups/devices/14",
      "name": "faithful-tarsler",
      "type": "Device",
      "product_info": {
        "description": null,
        "image_url": null,
        "model_name": "EliteBook 2560p",
        "vendor_name": "Hewlett-Packard",
        "avg_rating": null,
        "rating_count": null,
        "category": null
      },
      "primary": true
    }
  ]
}
```
