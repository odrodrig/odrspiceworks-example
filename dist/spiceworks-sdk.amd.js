/*! spiceworks-sdk - v0.0.2 - 2015-04-09
* http://developers.spiceworks.com
* Copyright (c) 2015 ; Licensed  */
define("spiceworks-sdk", 
  ["spiceworks-sdk/card","spiceworks-sdk/login","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Card = __dependency1__["default"];
    var Login = __dependency2__["default"];

    __exports__.Card = Card;
    __exports__.Login = Login;
  });
define("spiceworks-sdk/card-service", 
  ["rsvp","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var RSVP = __dependency1__;

    function CardService(card, capability){
      this.promise = card.oasis.connect(capability);
      this.name = capability;
    }

    CardService.prototype = {
      send: function (event, data) {
        this.promise.then(function (port) {
          port.send(event, data);
        });

        return this;
      },

      on: function (event, callback, context) {
        var binding = context || this;
        this.promise.then(function (port) {
          port.on(event, callback, binding);
        });

        return this;
      },

      request: function () {
        var service = this;
        var requestArgs = arguments;

        return RSVP.Promise(function (resolve, reject) {
          service.promise.then(function (port) {
            return port.request.apply(port, requestArgs);
          }, function (errorObj) {
            reject({
              errors: [{
                title: 'Connection Error',
                details: 'Could not connect to service ' + service.name + '. Make sure the service name is correct and that your App has access to this service.',
                data: errorObj
              }]
            });
          })
          .then(function (response) {
            resolve(response);
          }, function (error) {
            reject(error);
          });
        });
      }
    };

    __exports__["default"] = CardService;
  });
define("spiceworks-sdk/card", 
  ["oasis","./card-service","rsvp","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var CardService = __dependency2__["default"];
    var RSVP = __dependency3__;

    var oasis = new Oasis();
    oasis.autoInitializeSandbox();

    function Card(options) {
      this.options = options = options || {};
      this.oasis = oasis;
      this.cardServices = {};

      this.activationDeferred = RSVP.defer();
      this.activationDeferred.promise.fail( RSVP.rethrow );

      this.services('environment').on('activate', function (data) {
        this.activationDeferred.resolve(data);
      }, this);
    }

    Card.prototype = {
      services: function (capability) {
        if(!this.cardServices[capability]){
          this.cardServices[capability] = new CardService(this, capability);
        }

        return this.cardServices[capability];
      },

      onActivate: function (callback) {
        var card = this;
        card.activationDeferred.promise.then(function (data) {
          return callback.call(card, data);
        });
      }
    };

    __exports__["default"] = Card;
  });
define("spiceworks-sdk/login", 
  ["rsvp","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var RSVP = __dependency1__;

    var accessTokens = {};
    var windowFeatures = "width=460,height=420,menubar=no,toolbar=no,status=no,scrollbars=no";
    var identityServer = "https://accounts.spiceworks.com";
    // developer
    identityServer = "http://localhost:3000";

    function Login(args) {
      args = args || {};
      if (typeof args.clientId === 'undefined') {
        throw new Error("'clientId' must be provided in args");
      }

      this.clientId = args.clientId;
      this.targetWindow = null;
      this.deferred = null;

      window.addEventListener('message', this.messageReceiver.bind(this), false);
    }

    Login.prototype = {

      saveToken: function(token) {
        accessTokens[this.clientId] = token;
      },

      respond: function(args) {
        if (this.deferred) {
          this.deferred.resolve(args);
        }
      },

      messageReceiver: function() {
        if (event.source !== this.targetWindow) {
          return;
        }
        if (event.origin !== identityServer) {
          return;
        }
        if (event.data.messageType !== 'access_token') {
          return;
        }
        if (event.data.clientId !== this.clientId) {
          return;
        }

        this.targetWindow.close();
        this.saveToken(event.data.accessToken);
        this.respond(event.data.accessToken);
      },

      createIdentityUrl: function(path) {
        return (identityServer +
          path +
          '?response_type=token' +
          '&client_id=' + this.clientId +
          '&redirect_uri=' + encodeURIComponent('/oauth/callback?client_id=' + this.clientId));
      },

      login: function() {
        this.deferred = RSVP.defer();
        if (accessTokens[this.clientId]) {
          this.deferred.resolve(accessTokens[this.clientId]);
        }
        else {
          this.targetWindow = window.open(this.createIdentityUrl('/oauth/sign_in'), null, windowFeatures);
        }
        return this.deferred.promise;
      },

      create: function() {
        this.deferred = RSVP.defer();
        this.targetWindow = window.open(this.createIdentityUrl('/oauth/users/new'), null, windowFeatures);
        return this.deferred.promise;
      },

      // syntax sugar to match the rest of the library
      // e.g. request('login').then()
      request: function(action, options) {
        var args = [].slice.call(arguments).splice(1);
        return this[action].apply(this, args);
      }
    };

    __exports__["default"] = Login;
  });