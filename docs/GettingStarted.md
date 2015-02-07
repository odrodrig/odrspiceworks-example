# Getting Started

This doc will cover the steps you need to take to create a cloud app and make it available to the masses to install in their Spiceworks environment. We'll use an actual example to show you how to create a cloud app along the way.

### Installing Spiceworks

Before starting to build your cloud app, you first need to install the [Spiceworks Desktop: Developer Edition](http://community.spiceworks.com/private/app-center-dev-tools-beta/download).  The Spiceworks Desktop is where users will ultimately be installing and loading your cloud app.  The developer edition of the Spiceworks Desktop has some small admin features that make it easier to build and test your cloud app during development, before it's been published to the Spiceworks App Center.

Like the IT-pro version of the Spiceworks Desktop, the developer edition will need to be installed in a Windows environment (Note: We are currently working on development tools that avoid this requirement).

Install the [Spiceworks Desktop: Developer Edition](http://community.spiceworks.com/private/app-center-dev-tools-beta/download).

### Create a place for your app to live

Once you've installed Spiceworks, we'll need to find a home for your app. A Spiceworks app is just a website, so make sure that your web app is being served somewhere so that it can be accessed by Spiceworks.  This means that you must have a local or a remote web server serving your web application so that it can be loaded within Spiceworks. At this point, you can just create a framework for the app. You'll just need a host URL to get the app creation process started within Spiceworks.

#### Example
In this example, we create a single-page application in a Github Gist. If you're not familiar with Github, it basically just gives you a place to store code. You can then use sites like http://bl.ocks.org to then render that code in a usable format for Spiceworks.

1) Go to <https://gist.github.com> to create a Gist. It will ask you if you want to save the Gist as "secret" or "public". Either one works just fine. We can create the framework for the ubiquitous "Hello world!" application like so:

``` html
   <!DOCTYPE html>
   <html>
    <body>
     <h3>Hello world!</h3>
    </body>
   </html>
```
2) Save the Gist file as **index.html**.

3) Make sure that your Gist is working properly by testing it in a browser using <http://bl.ocks.org>. So the Gist I created on Github (at <https://gist.github.com/babbtx/dab075639fef532d612a>) can be tested by viewing it at <http://bl.ocks.org/babbtx/raw/dab075639fef532d612a/>. The bl.ocks.org URL is built using your Github username, the keyword "raw", and the Gist SHA.
   (**Note:** The http://bl.ocks.org site caches the page for several minutes, so changes you make to the source may not be immediately reflected in the application.

Go [here][Card Examples] for some simple examples of Spiceworks apps.

### Create & register your web app with Spiceworks

After you have Spiceworks Developer Edition installed and your web app running, you need to create and register your web app inside of Spiceworks. You can do this by following these steps:

1) Click the Spiceworks logo at the top. This takes you to the management screen for installed apps. Create a new app by clicking **New App &rarr; New Platform App**.

2) Fill in your app's basic info. The App Name field will be what is displayed in the app center, and the Namespace is what will be listed in the url for your app in the Spiceworks App Center. So in our example, the App Name would be Hello World! and the Namespace could be hello-world.

3) Now you'll need to let Spiceworks know where to pull the app from and display it. You'll want to enter your App Host URL, which is the location of your web app's landing page, as a Full Page App Placement. In our example, this would be http://bl.ocks.org/babbtx/raw/dab075639fef532d612a/. Our example application does not have any pages to be placed specifically upon tickets or devices, therefore we will leave those options disabled.

4) Set any permissions your app will require. If you're planning on pulling any info from the IT pros' Spiceworks installations to display in your app or to dictate what is displayed, you'll need to indicate that here. Our example application is going to use the Inventory service. Click the toggle to choose this permission.

5) Click **Save** to publish the app to the App Center.

### Add javascript to your application to get data from Spiceworks
Now that you have registered your application, you can add some Javascript to display help desk and/or inventory data retrieved from Spiceworks.

1) **Include Spiceworks SDK:** Minimally, you'll want to include the Spiceworks SDK javascript. For our "Hello world!" example, we're including jQuery as well.

``` javascript
   <head>
    <script src="https://www.dropbox.com/s/l6hgjq7mh52o6od/spiceworks-sdk.js?dl=1&raw=1" type="text/javascript"></script>
    <script src="https://code.jquery.com/jquery-2.1.3.min.js" type="text/javascript"></script>
   </head>
```

2) **Request service:** Services give you access to the data inside Spiceworks. You can find details of the services available here: [Help Desk](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/apis/helpdesk.md) and Inventory (Coming Soon). Here's what we're using in our example:

``` javascript
   <script type="text/javascript">
    $(document).ready(function(){
     var card = new SW.Card();
     var inventory = card.services('inventory');
    });
   </script>
```

3) **Request data:** A data request returns a Javascript Promise, which, when resolved, provides you with the data you requested.

``` javascript
   inventory.request('devices').then(function(data){
    /* do something */ });
```

4) **Format the data accordingly:** Now you'll need to make the data presentable (yes, there are much better ways to format the data into HTML DOM, but bear with me for the purposes of this example).

``` javascript
   inventory.request('devices').then(function(data){
    $.each(data.devices, function(index, device){
     $('body').append('<p>' + device.name);
    });
   });
```

#### Example
At this point, our example app looks like this:

``` javascript
<!DOCTYPE html>
<html>
 <head>
  <script src="https://www.dropbox.com/s/l6hgjq7mh52o6od/spiceworks-sdk.js?dl=1&raw=1" type="text/javascript"></script>
  <script src="https://code.jquery.com/jquery-2.1.3.min.js" type="text/javascript"></script>
  <script type="text/javascript">
   $(document).ready(function(){
     var card = new SW.Card();
     var inventory = card.services('inventory');
     inventory.request('devices').then(function(data){
       $.each(data.devices, function(index, device){
         $('body').append('<p>' + device.name);
       });
     });
   });
  </script>
 </head>
 <body>
  <h3>Hello world!</h3>
 </body>
</html>
```

5) **Reload your application and check the results!** Now if you reload your application at /apps/hello-world in your Spiceworks Developer Edition server, you will see Hello World! and a list of device names.

## Resources

Now that you've gone over how to create an application for Spiceworks, you're ready to be released to the wild. Here are some resources that should help you along the way (or, "it's dangerous to go alone..." joke):

* [Download the Spiceworks Desktop: Developer Edition](http://community.spiceworks.com/private/app-center-dev-tools-beta/download)
* [Spiceworks Cloud App Examples][Card Examples]
* [Spiceworks App API Basics](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/CanvasAppApis.md)
* [Spiceworks Help Desk API Services](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/apis/helpdesk.md)

[Cloud App API Basics]: https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/CanvasAppApis.md "Spiceworks App API Basics"
[Desktop Dev Download]: http://www.spiceworks.com/ "Download the Spiceworks Desktop: Development Version"
[Card Examples]: http://github.com/spiceworks/spiceworks-js-sdk/tree/master/docs/examples "Spiceworks Cloud App Card Examples"
[Card Examples Readme]: http://github.com/spiceworks/ "Spiceworks Cloud App Card Examples: README"
[Help Desk Services List]: /documentation/cloud-apps/helpdesk-service-reference "Spiceworks Help Desk API Services"
[Inventory Services List]: /documentation/cloud-apps/inventory-service-reference "Spiceworks Inventory API Services"
