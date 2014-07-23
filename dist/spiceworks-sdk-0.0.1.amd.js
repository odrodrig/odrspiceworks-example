/*! spiceworks-sdk - v0.0.1 - 2014-07-23
* http://developers.spiceworks.com
* Copyright (c) 2014 ; Licensed  */
define("spiceworks-sdk", 
  ["oasis","spiceworks-sdk/card","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var Card = __dependency2__["default"];

    self.Oasis = Oasis;
    var oasis = new self.Oasis();
    oasis.autoInitializeSandbox();

    __exports__.oasis = oasis;
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

      request: function (requested) {
        var promise = this.promise;

        return RSVP.Promise(function (resolve, reject) {
          promise.then(function (port) {
            return port.request(requested);
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
  ["oasis","./card-service","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var CardService = __dependency2__["default"];

    function Card(options) {
      this.options = options = options || {};
      this.oasis = SW.oasis || new Oasis();
      this.cardServices = {};
    }

    Card.prototype = {
      services: function (capability) {
        if(!this.cardServices[capability]){
          this.cardServices[capability] = new CardService(this, capability);
        }

        return this.cardServices[capability];
      }
    };

    __exports__["default"] = Card;
  });