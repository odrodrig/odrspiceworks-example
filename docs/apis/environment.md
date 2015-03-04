# Environment Service

## Environment

### Requests

#### Get the environment

Get environment information from the Spiceworks application in which your
cloud app is installed:

```js
card.services('environment').request('environment')
```

Alternatively, this environment information is available on App Card activation:

```js
var card = new SW.Card();
card.onActivate(function(environment){
  // see response below
});
```

##### Response
```js
{
  "app_host":
    {
      "app_name": "desktop",
      "auid": "92a450d9a3e596d7bef9ed9853b6a454", // see (1) below
      "version": "7.4.00000",
      "placement": {  // see (3)
        "name": "device",
        "current_device_id": 123
      }
    }
  "user":
    {
      "id": 159,
      "user_auid": "e34e59c92f43b49f9725a29f86632c12", // see (2) below
      "show_url": "/people/159",
      "first_name": "Jolly",
      "last_name": "Fellow",
      "role": "admin",
      "department": "DEV",
      "avatar_path": "/images/icons/medium/person-avatar-admin.png"
    }
}
```

Notes:

(1) The app-unique identifier `app_host.auid` uniquely identifies the Spiceworks application
into which your cloud app is integrated. This identifier is unique to your cloud app.

(2) The app-unique identifier `user.user_auid` uniquely identifies the current user
of Spiceworks using your app. This identifier is unique to your cloud app, and will be
consistent for the Spiceworks user across multiple and/or different Spiceworks applications.

(3) The `placement` is the location within the Spiceworks application where your
app is being activated. The `name` of the placement will always be provided, and
other information relevant to the location will be provided in the `placement`
object.

#### List users

List all users (IT Pros) in the system:

```js
card.services('environment').request('users')
```

##### Response

```js
{
  "meta": {
    "total_entries": 3,
    "page_count": 1,
    "per_page": 30,
    "current_page": 1
  },
  "users": [...] // see below for user JSON example
}
```

#### Get a single user

```js
card.services('environment').request('user', id)
```

##### Parameters

Name | Type | Description
-----|------|--------------
`id`|`integer`| The `id` of the user


##### Response

Example user (note all arrays have been reduced to a single example item)

```js
{
  "id": 2,
  "first_name": "Lucy",
  "last_name": "Chipotle",
  "role": "admin",
  "department": "IT",
  "avatar_path": "/images/icons/medium/person-avatar-admin.png",
  "show_url": "/people/2",
  "user_auid": "e34e59c92f43b49f9725a29f86632c12",
  "community_unread_message_count": null,
  "community_activity_count": null,
  "community_activity_seen_at": null,
  "title": "Chief IT Person",
  "location": "Main Office",
  "start_date": null,
  "created_at": "2015-02-26T00:46:53-06:00",
  "updated_at": "2015-02-26T01:52:23-06:00",
  "billing_rate": 50.0,
  "supervisor": {
    "id": 3,
    "first_name": "David",
    "last_name": "Rocoto",
    "role": "admin",
    "department": "IT",
    "avatar_path": "/images/icons/medium/person-avatar-admin.png",
    "show_url": "/people/3"
  },
  "notifications": {
    "alert": false,
    "helpdesk": false,
    "weekly_updates": false
  },
  "tickets": {
    "creator": {
      "meta": {
        "total_entries": 0
      },
      "tickets": [

      ]
    },
    "assignee": {
      "meta": {
        "total_entries": 9
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
            "id": 5,
            "first_name": "Justin",
            "last_name": "Brownie",
            "role": "end_user",
            "department": null,
            "avatar_path": "/images/icons/medium/person-avatar-restricted.png",
            "show_url": "/people/5"
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
        "total_entries": 2
      },
      "tickets": [
        {
          "id": 36,
          "show_url": "/tickets/list/single_ticket/36",
          "summary": "Mouse troubles",
          "status": "open",
          "priority": 3,
          "description": "My mouse squeeks too much and the co worker that sits next to me gives me a terrible look everytime I scroll.",
          "due_at": "2015-02-26T19:11:53-06:00",
          "created_at": "2015-02-20T00:46:59-06:00",
          "updated_at": "2015-02-26T00:47:09-06:00",
          "closed_at": null,
          "creator": {
            "id": 18,
            "first_name": "Marie",
            "last_name": "Rocoto",
            "role": "end_user",
            "department": null,
            "avatar_path": "/images/icons/medium/person-avatar-restricted.png",
            "show_url": "/people/18"
          },
          "assignee": null
        }
      ]
    }
  },
  "purchases": {
    "creator": {
      "meta": {
        "total_entries": 0
      },
      "purchases": [

      ]
    },
    "receiver": {
      "meta": {
        "total_entries": 1
      },
      "purchases": [
        {
          "id": 1,
          "show_url": "/purchases/1",
          "name": "Logitech Keyboard K120 for Business - Cable - USB - PC",
          "purchased": false,
          "received": false,
          "price": 0.0,
          "product_image": "//static.spiceworks.com/images/products/0007/6787/3031596_profile.jpeg",
          "part_number": "920-003688"
        }
      ]
    }
  },
  "devices": [
    {
      "id": 70,
      "show_url": "/inventory/groups/devices/70",
      "name": "fancy-okapi",
      "type": "Device",
      "product_info": {
        "description": null,
        "image_url": "//h10003.www1.hp.com/digmedialib/prodimg/lowres/c02680978.jpg",
        "model_name": "ProBook 6460b",
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
