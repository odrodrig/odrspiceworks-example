Running example apps
-------------------------------
1. Clone this repo `https://github.com/spiceworks/spiceworks-js-sdk.git`
2. Switch to the directory `docs/examples/hello-world`
3. Ensure that [Node.js](http://nodejs.org/) is installed
4. Run `npm install` to install required packages
5. Run `node app.js` to start app server
6. Navigate to the hostname and port the app is running on (by default, `http://localhost:3000/`)

Adding example apps to Spiceworks
--------------------------------------------------
1. Navigate to Settings (top right of page, gray gear icon)
2. Under `Additional Settings`, select `Manage Apps`
3. In the `New App` drop down menu select `New Platform App`
4. Fill out the `App Name` and the `Namespace` (the short url where you want the app to appear)
5. Set the `Full Page URL` to the location of the example app (by default, `http://localhost:3000/`)
6. Turn on any additional `App Placements` where you want to see the example app, using the same URL as step 4
7. Set the `App Permissions` (depends on the example app--it's OK to enable all permissions if you're just playing around)
8. `Save` the App
9. You will be redirected to the example app inside of Spiceworks
