/*! spiceworks-sdk - v0.0.1 - 2014-07-22
* http://developers.spiceworks.com
* Copyright (c) 2014 ; Licensed  */
define("consumers/assertion_consumer", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var AssertionConsumer = Oasis.Consumer.extend({
      initialize: function() {
        var service = this;


        window.ok = window.ok || function(bool, message) {
          service.send('ok', { bool: bool, message: message });
        };

        window.notOk = window.notOk || function(bool, message) {
          service.send('notOk', { bool: bool, message: message });
        };

        window.equal = window.equal || function(expected, actual, message) {
          service.send('equal', { expected: expected, actual: actual, message: message });
        };

        window.done = window.done || function() {
          service.send('done');
        };
      },

      events: {
        instruct: function(info) {
          this.card.instruct(info);
        }
      }
    });

    __exports__["default"] = AssertionConsumer;
  });
define("services/assertion_service", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var AssertionService = Oasis.Service.extend({
      initialize: function(port) {
        this.sandbox.assertionPort = port;
      },

      events: {
        ok: function(data) {
          assert.ok(data.bool, data.message);
        },

        notOk: function(data){
          assert.notOk(data.bool, data.message);
        },

        equal: function (data) {
          assert.equal(data.expected, data.actual, data.message);
        },

        done: function() {
          done();
        }
      }
    });

    __exports__["default"] = AssertionService;
  });
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
  ["exports"],
  function(__exports__) {
    "use strict";

    function CardService(card, capability){
      this.promise = card.oasis.connect(capability);
    }

    CardService.prototype = {
      send: function (event, data) {
        this.promise.then(function (port) {
          port.send(event, data);
        });

        return this;
      },

      on: function (event, callback) {
        this.promise.then(function (port) {
          port.on(event, callback);
        });

        return this;
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
define("spiceworks-sdk/consumers", 
  ["exports"],
  function(__exports__) {
    "use strict";

    /**
      Default Oasis consumers provided to every conductor instance.
    */
    var consumers = { };

    function defaultConsumers() {
      return this.consumers;
    }

    function addDefaultConsumer(capability, consumer) {
      if (!consumer) { consumer = Oasis.Consumer; }
      this.consumers[capability] = consumer;
    }

    function removeDefaultConsumer(capability) {
      var index = a_indexOf.call(this.capabilities, capability);
      if (index !== -1) {
        return this.capabilities.splice(index, 1);
      }
    }

    __exports__.defaultConsumers = defaultConsumers;
    __exports__.addDefaultConsumer = addDefaultConsumer;
    __exports__.removeDefaultConsumer = removeDefaultConsumer;
  });
define("spiceworks-sdk/services", 
  ["exports"],
  function(__exports__) {
    "use strict";

    /**
      Default Oasis services provided to every conductor instance.
    */
    var services = { };
    var capabilities = [ ];

    function defaultCapabilities() {
      return this.capabilities;
    }

    function defaultServices() {
      return this.services;
    }

    function addDefaultCapability(capability, service) {
      if (!service) { service = Oasis.Service; }
      this.capabilities.push(capability);
      this.services[capability] = service;
    }

    function removeDefaultCapability(capability) {
      var index = a_indexOf.call(this.capabilities, capability);
      if (index !== -1) {
        return this.capabilities.splice(index, 1);
      }
    }

    __exports__.defaultCapabilities = defaultCapabilities;
    __exports__.defaultServices = defaultServices;
    __exports__.addDefaultCapability = addDefaultCapability;
    __exports__.removeDefaultCapability = removeDefaultCapability;
  });