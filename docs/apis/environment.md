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
var card = new SW.card();
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
      "version": "7.4.00000"
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

##### Response

Example user (note all arrays have been reduced to a single example item)

```js
{
  "id": 2,
  "first_name": "Mark",
  "last_name": "Jalapeno",
  "role": "admin",
  "department": "IT",
  "avatar_path": null,
  "show_url": "/people/2",
  "user_auid": "e34e59c92f43b49f9725a29f86632c12",
  "community_unread_message_count": null,
  "community_activity_count": null,
  "community_activity_seen_at": null,
  "office_phone": null,
  "cell_phone": null,
  "title": null,
  "location": null,
  "start_date": null,
  "created_at": "2015-02-18T22:48:36-08:00",
  "updated_at": "2015-02-18T22:48:36-08:00",
  "billing_rate": 50.0,
  "supervisor": null
}
```
