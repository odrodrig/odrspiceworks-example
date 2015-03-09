/*! spiceworks-sdk - v0.0.2 - 2015-03-09
* http://developers.spiceworks.com
* Copyright (c) 2015 ; Licensed  */
define("spiceworks-sdk", 
  ["spiceworks-sdk/card","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Card = __dependency1__["default"];

    __exports__.Card = Card;
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

      on: function (event, callback) {
        var binding = this;
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
  ["oasis","./card-service","rsvp","./environment-consumer","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var CardService = __dependency2__["default"];
    var RSVP = __dependency3__;
    var EnvironmentConsumer = __dependency4__["default"];

    var oasis = new Oasis();
    oasis.autoInitializeSandbox();

    function Card(options) {
      this.options = options = options || {};
      this.oasis = oasis;
      this.cardServices = {};

      this.activationDeferred = RSVP.defer();
      this.activationDeferred.promise.fail( RSVP.rethrow );

      this.oasis.connect({
        consumers: {
          environment: EnvironmentConsumer.extend({card: this})
        }
      });
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
define("spiceworks-sdk/environment-consumer", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var EnvironmentConsumer = Oasis.Consumer.extend({
      events: {
        activate: function (data) {
          this.card.activationDeferred.resolve(data);
        }
      }
    });

    __exports__["default"] = EnvironmentConsumer;
  });