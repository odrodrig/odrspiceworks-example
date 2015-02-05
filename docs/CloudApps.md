# What is a Cloud App?

Cloud Apps allow you to get your application in front of IT pros right from within Spiceworks.  Building a Cloud App lets your content appear inside of Spiceworks applications and it gives you the ability to integrate your app with the core Spiceworks experience through the [Cloud App APIs](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/CanvasAppApis.md).  

Cloud Apps are built on top of web technologies, so it's easy to get started or to integrate your existing web application.

# App Cards

Apps are made up of a collection of web pages that we refer to as **Cards**.  A card is a blank canvas that appears in a specific location inside of Spiceworks where your app can display content.  Cards will always have their own full page linked to in the primary navigation, but you can also have them displayed within each ticket or device view.



You populate a card by providing a URL that contains HTML, JavaScript and CSS.  When your card is loaded inside of Spiceworks, we load the URL within an `iframe` on that page.  All cards have access to the [Cloud App APIs](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/CanvasAppApis.md), which provide a secure way for your web app to communicate with Spiceworks from inside of the `iframe`.


## Full Page Cards

One important example of a Cloud App card, is the **Full Page Card**.  A Full Page Card renders your application inside of its own page within Spiceworks.

All Cloud Apps must have a Full Page Card.  This is the card that will be rendered when your App is launched from other locations inside of Spiceworks.


By default, the Full Page Card frame is full-width (ranging from 710-935px) and the full browser height.


# Next Steps

* Visit the [Getting Started](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/GettingStarted.md) page for a step-by-step guide to building a Spiceworks Cloud App.
* Dive into the [Cloud App API](https://github.com/spiceworks/spiceworks-js-sdk/blob/master/docs/CanvasAppApis.md) basics


[Cloud APIs Link]: /documentation/cloud-apps/api-overview "Cloud App APIs Overview"
[Getting Started Link]: /documentation/cloud-apps/getting-started "Getting Started with Spiceworks Cloud Apps"
[Spiceworks App Center Overview]: /documentation/app-center-overview "Spiceworks App Center Overview"
