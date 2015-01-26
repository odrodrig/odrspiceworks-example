# Getting Started

## Installing Spiceworks

Before starting to build your Cloud App, you first need to install the [Spiceworks Desktop: Development Version][Desktop Dev Download].  The Spiceworks Desktop is where users will ultimately be installing and loading your Cloud App.  The Development Version of the Spiceworks Desktop has some small admin features that make it easier to build and test your Cloud App during development, before it's been published to the Spiceworks App Center.

Like the IT-pro version of the Spiceworks Desktop, the Development Version will need to be installed in a Windows environment.  (Note: We are currently working on development tools that avoid this requirement.)

Install the [Spiceworks Desktop: Development Version][Desktop Dev Download].

## Create Your First Card

Once you've installed Spiceworks, let's start creating your App's Full Page Card.  A Full Page Card is just a website, so you can use an existing web application to test out your App, or create a new one.

If you are creating a new web application, make sure that your web app is being served somewhere so that it can be accessed by Spiceworks.  This means that you must have a local or a remote web server serving your web application, so that it can be loaded into a card.  In the next section, we will load this web application into a Full Page Card inside of your Spiceworks Desktop installation.

Go [here][Card Examples] for some simple examples of a Full Page Card.   If you want to test any of the card examples with your Spicewokrs Desktop installation in the next section, follow the intsructions in the [Card Examples Readme][Card Examples Readme].

## Create An App

After you have the Spiceworks Desktop installed and your Full Page Card running, you can create your Cloud App inside of the Spiceworks Desktop by visiting `/apps` and clicking 'New App'.

[Image]

In the New App form, you can specify the following values (don't worry, these can all be changed later):

* Your App's name
* The url to your app's Full Page Card
* Your App's short url (namespace).  This is the url where users will be linked to your App inside of the Spiceworks Desktop.
* The current version number of your App.  This will be used when you upload your App to the Spiceworks App Center
* A comma separated list of the services that your App needs access to.  See [here][Cloud App Services List] for a list of [services][Cloud App Services List].

After filling out the New App form and clicking 'Create', you will be redirected to your app's Full Page Card.

**Note:** Currently, the Spiceworks Desktop only supports Full Page Cards.  Over time we will be expanding the locations of Cloud App cards throughout Spiceworks.

## Next Steps

Once you've created your app and you have it rendering inside of Spiceworks, you can start integrating your app with Spiceworks using the Cloud App APIs.

* See the [Cloud App API Basics](basics link) for a walkthrough of the fundamentals of the Spiceworks App API.
* Go straight to the [Cloud App API Services](services link) page to see the full documentation for each of the available APIs.

[Desktop Dev Download]: http://www.spiceworks.com/ "Download the Spiceworks Desktop: Development Version"
[Card Examples]: http://github.com/spiceworks/ "Spiceworks Cloud App Card Examples"
[Card Examples Readme]: http://github.com/spiceworks/ "Spiceworks Cloud App Card Examples: README"
[Cloud App Services List]: /documentation/cloud-apps/services "Spiceworks App API Services"
