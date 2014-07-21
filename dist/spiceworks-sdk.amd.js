/*! spiceworks-sdk - v0.0.1 - 2014-07-21
* http://developers.spiceworks.com
* Copyright (c) 2014 ; Licensed  */
define("consumers/assertion_consumer", 
  ["conductor","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Conductor = __dependency1__["default"];

    var AssertionConsumer = Conductor.Oasis.Consumer.extend({
      initialize: function() {
        var service = this;


        window.ok = window.ok || function(bool, message) {
          service.send('ok', { bool: bool, message: message });
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
  ["conductor","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Conductor = __dependency1__["default"];

    var AssertionService = Conductor.Oasis.Service.extend({
      initialize: function(port) {
        this.sandbox.assertionPort = port;
      },

      events: {
        ok: function(data) {
          assert.ok(data.bool, data.message);
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
  ["conductor","spiceworks-sdk/card","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Conductor = __dependency1__["default"];
    var card = __dependency2__.card;

    self.Conductor = Conductor;
    self.Oasis = Conductor.Oasis;
    self.oasis = new self.Oasis();
    self.oasis.autoInitializeSandbox();

    __exports__.oasis = oasis;
    __exports__.card = card;
  });
define("spiceworks-sdk/card", 
  ["conductor","conductor/card","consumers/assertion_consumer","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Conductor = __dependency1__["default"];
    var AssertionConsumer = __dependency3__["default"];

    function extend(a, b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
      return a;
    }

    function card(options) {
      options.consumers = extend({
        assertion: AssertionConsumer
      }, options.consumers);

      return Conductor.card.call(this, options, this.oasis);
    }

    __exports__.card = card;
  });