(function(global) {
/*! spiceworks-sdk - v0.0.1 - 2014-07-18
* http://developers.spiceworks.com
* Copyright (c) 2014 ; Licensed  */
var define, require;

(function() {
  var registry = {}, seen = {};

  define = function(name, deps, callback) {
    registry[name] = { deps: deps, callback: callback };
  };

  require = function(name) {

    if (seen[name]) { return seen[name]; }
    seen[name] = {};

    if (!registry[name]) {
      throw new Error("Could not find module " + name);
    }

    var mod = registry[name],
        deps = mod.deps,
        callback = mod.callback,
        reified = [],
        exports;

    for (var i=0, l=deps.length; i<l; i++) {
      if (deps[i] === 'exports') {
        reified.push(exports = {});
      } else {
        reified.push(require(resolve(deps[i])));
      }
    }

    var value = callback.apply(this, reified);
    return seen[name] = exports || value;

    function resolve(child) {
      if (child.charAt(0) !== '.') { return child; }
      var parts = child.split("/");
      var parentBase = name.split("/").slice(0, -1);

      for (var i=0, l=parts.length; i<l; i++) {
        var part = parts[i];

        if (part === '..') { parentBase.pop(); }
        else if (part === '.') { continue; }
        else { parentBase.push(part); }
      }

      return parentBase.join("/");
    }
  };

  require.entries = registry;
})();

define("conductor", 
  ["oasis","conductor/version","conductor/card_reference","conductor/card_dependencies","oasis/shims","oasis/util","conductor/capabilities","conductor/multiplex_service","conductor/adapters","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var Version = __dependency2__["default"];
    var CardReference = __dependency3__["default"];
    var CardDependencies = __dependency4__["default"];
    var o_create = __dependency5__.o_create;
    var a_forEach = __dependency5__.a_forEach;
    var a_indexOf = __dependency5__.a_indexOf;
    var delegate = __dependency6__.delegate;
    var ConductorCapabilities = __dependency7__["default"];
    var MultiplexService = __dependency8__["default"];
    var adapters = __dependency9__["default"];

    function Conductor(options) {
      this.options = options || {};
      this.oasis = new Oasis();

      this.data = {};
      this.cards = {};
      this._capabilities = new ConductorCapabilities();
      Conductor._dependencies = new CardDependencies();
    }

    Conductor.Version = Version;
    Conductor.Oasis = Oasis;

    Conductor._dependencies = new CardDependencies();
    Conductor.require = function(url) { Conductor._dependencies.requireJavaScript(url); };
    Conductor.requireCSS = function(url) { Conductor._dependencies.requireCSS(url); };

    Conductor.MultiplexService = MultiplexService;
    Conductor.adapters = adapters;

    var RSVP = Conductor.Oasis.RSVP,
        Promise = RSVP.Promise;

    function coerceId(id) {
      return id + '';
    }

    Conductor.prototype = {
      configure: function (name, value) {
        if ('eventCallback' === name || 'allowSameOrigin' === name) {
          this.oasis.configure(name, value);
        } else {
          throw new Error("Unexpected Configuration `" + name + "` = `" + value + "`");
        }
      },

      loadData: function(url, id, data) {
        id = coerceId(id);

        this.data[url] = this.data[url] || {};
        this.data[url][id] = data;

        var cards = this.cards[url] && this.cards[url][id];

        if (!cards) { return; }

        a_forEach.call(cards, function(card) {
          card.updateData('*', data);
        });
      },

      updateData: function(card, bucket, data) {
        var url = card.url,
            id = card.id;

        this.data[url][id][bucket] = data;

        var cards = this.cards[url][id].slice(),
            index = a_indexOf.call(cards, card);

        cards.splice(index, 1);

        a_forEach.call(cards, function(card) {
          card.updateData(bucket, data);
        });
      },

      load: function(url, id, options) {
        id = coerceId(id);

        var datas = this.data[url],
            data = datas && datas[id],
            _options = options || {},
            extraCapabilities = _options.capabilities || [],
            capabilities = this.defaultCapabilities().slice(),
            cardServices = o_create(this.defaultServices()),
            adapter = _options.adapter,
            prop;

        capabilities.push.apply(capabilities, extraCapabilities);

        // TODO: this should be a custom service provided in tests
        if (this.options.testing) {
          capabilities.unshift('assertion');
        }

        // It is possible to add services when loading the card
        if( _options.services ) {
          for( prop in _options.services) {
            cardServices[prop] = _options.services[prop];
          }
        }

        var sandbox = this.oasis.createSandbox({
          url: url,
          capabilities: capabilities,
          services: cardServices,

          adapter: adapter
        });

        sandbox.data = data;
        sandbox.activateDefered = RSVP.defer();
        sandbox.activatePromise = sandbox.activateDefered.promise;

        var card = new CardReference(sandbox);

        this.cards[url] = this.cards[url] || {};
        var cards = this.cards[url][id] = this.cards[url][id] || [];
        cards.push(card);

        card.url = url;
        card.id = id;

        sandbox.conductor = this;
        sandbox.card = card;

        // TODO: it would be better to access the consumer from
        // `conductor.parentCard` after the child card refactoring is in master.
        if (this.oasis.consumers.nestedWiretapping) {
          card.wiretap(function (service, messageEvent) {
            this.oasis.consumers.nestedWiretapping.send(messageEvent.type, {
              data: messageEvent.data,
              service: service+"",
              direction: messageEvent.direction,
              url: url,
              id: id
            });
          });
        }

        return card;
      },

      unload: function(card) {
        var cardArray = this.cards[card.url][card.id],
            cardIndex = a_indexOf.call(cardArray, card);

        card.sandbox.conductor = null;

        card.sandbox.terminate();
        delete cardArray[cardIndex];
        cardArray.splice(cardIndex, 1);
      },

      /**
        @return array the default list of capabilities that will be included for all
        cards.
      */
      defaultCapabilities: delegate('_capabilities', 'defaultCapabilities'),

      /**
        @return object the default services used for the default capabilities.
      */
      defaultServices: delegate('_capabilities', 'defaultServices'),

      /**
        Add a default capability that this conductor will provide to all cards,
        unless the capability is not supported by the specified adapter.

        @param {string} capability the capability to add
        @param {Oasis.Service} [service=Oasis.Service] the default service to use
        for `capability`.  Defaults to a plain `Oasis.Service`.
      */
      addDefaultCapability: delegate('_capabilities', 'addDefaultCapability'),

      // Be careful with this: it does no safety checking, so things will break if
      // one for example removes `data` or `xhr` as a default capability.
      //
      // It is however safe to remove `height`.
      removeDefaultCapability: delegate('_capabilities', 'removeDefaultCapability')
    };

    __exports__["default"] = Conductor;
  });
define("conductor/adapters", 
  ["oasis","conductor/inline_adapter","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var inlineAdapter = __dependency2__["default"];

    var adapters = {
      iframe: Oasis.adapters.iframe,
      inline: inlineAdapter
    };

    __exports__["default"] = adapters;
  });
define("conductor/assertion_consumer", 
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

        window.equal = window.equal || function(expected, actual, message) {
          service.send('equal', { expected: expected, actual: actual, message: message });
        };

        window.start = window.start || function() {
          service.send('start');
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
define("conductor/assertion_service", 
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
          ok(data.bool, data.message);
        },

        equal: function (data) {
          equal(data.expected, data.actual, data.message);
        },

        start: function() {
          start();
        }
      }
    });

    __exports__["default"] = AssertionService;
  });
define("conductor/capabilities", 
  ["oasis","conductor/services","conductor/lang","oasis/shims","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var services = __dependency2__.services;
    var copy = __dependency3__.copy;
    var a_indexOf = __dependency4__.a_indexOf;

    function ConductorCapabilities() {
      this.capabilities = [
        'xhr', 'metadata', 'render', 'data', 'lifecycle', 'height',
        'nestedWiretapping' ];
      this.services = copy(services);
    }

    ConductorCapabilities.prototype = {
      defaultCapabilities: function () {
        return this.capabilities;
      },

      defaultServices: function () {
        return this.services;
      },

      addDefaultCapability: function (capability, service) {
        if (!service) { service = Oasis.Service; }
        this.capabilities.push(capability);
        this.services[capability] = service;
      },

      removeDefaultCapability: function (capability) {
        var index = a_indexOf.call(this.capabilities, capability);
        if (index !== -1) {
          return this.capabilities.splice(index, 1);
        }
      }
    };

    __exports__["default"] = ConductorCapabilities;
  });
define("conductor/card", 
  ["conductor","oasis","conductor/assertion_consumer","conductor/xhr_consumer","conductor/render_consumer","conductor/metadata_consumer","conductor/data_consumer","conductor/lifecycle_consumer","conductor/height_consumer","conductor/nested_wiretapping_consumer","conductor/multiplex_service","oasis/shims"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__) {
    "use strict";
    var Conductor = __dependency1__["default"];
    var Oasis = __dependency2__["default"];
    var AssertionConsumer = __dependency3__["default"];
    var XhrConsumer = __dependency4__["default"];
    var RenderConsumer = __dependency5__["default"];
    var MetadataConsumer = __dependency6__["default"];
    var DataConsumer = __dependency7__["default"];
    var LifecycleConsumer = __dependency8__["default"];
    var HeightConsumer = __dependency9__["default"];
    var NestedWiretapping = __dependency10__["default"];
    var MultiplexService = __dependency11__["default"];
    var OasisShims = __dependency12__;

    var RSVP = Oasis.RSVP,
        Promise = RSVP.Promise,
        o_create = OasisShims.o_create,
        a_forEach = OasisShims.a_forEach,
        a_map = OasisShims.a_map;

    function extend(a, b) {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
      return a;
    }

    function getBase () {
      var link = document.createElement("a");
      link.href = "!";
      var base = link.href.slice(0, -1);

      return base;
    }

    function Card(options, _oasis) {
      var card = this,
          prop,
          oasis = _oasis || self.oasis;

      for (prop in options) {
        this[prop] = options[prop];
      }

      this.consumers = o_create(oasis.consumers);
      this.options = options = options || {};

      this.deferred = {
        data: this.defer(),
        xhr: this.defer()
      };

      options.events = options.events || {};
      options.requests = options.requests || {};

      this.activateWhen(this.deferred.data.promise, [ this.deferred.xhr.promise ]);

      var cardOptions = {
        consumers: extend({
          // TODO: this should be a custom consumer provided in tests
          assertion: AssertionConsumer,
          xhr: XhrConsumer,
          render: RenderConsumer,
          metadata: MetadataConsumer,
          data: DataConsumer,
          lifecycle: LifecycleConsumer,
          height: HeightConsumer,
          nestedWiretapping: NestedWiretapping
        }, options.consumers)
      };

      for (prop in cardOptions.consumers) {
        cardOptions.consumers[prop] = cardOptions.consumers[prop].extend({card: this});
      }

      oasis.connect(cardOptions);
    }

    Card.prototype = {
      waitForActivation: function () {
        return this._waitForActivationDeferral().promise;
      },

      updateData: function(name, hash) {
        oasis.portFor('data').send('updateData', { bucket: name, object: hash });
      },

      /**
        A card can contain other cards.

        `childCards` is an array of objects describing the differents cards. The accepted attributes are:
        * `url` {String} the url of the card
        * `id` {String} a unique identifier for this instance (per type)
        * `options` {Object} Options passed to `Conductor.load` (optional)
        * `data` {Object} passed to `Conductor.loadData`

        Example:

          Conductor.card({
            childCards: [
              { url: '../cards/survey', id: 1 , options: {}, data: '' }
            ]
          });

        Any `Conductor.Oasis.Service` needed for a child card can be simply
        declared with the `services` attribute.  A card can contain other cards.

        Example:

          Conductor.card({
            services: {
              survey: SurveyService
            },
            childCards: [
              {url: 'survey', id: 1 , options: {capabilities: ['survey']} }
            ]
          });

        `loadDataForChildCards` can be defined when a child card needs data passed
        to the parent card.

        Once `initializeChildCards` has been called, the loaded card can be
        accessed through the `childCards` attribute.

        Example:

          var card = Conductor.card({
            childCards: [
              { url: '../cards/survey', id: 1 , options: {}, data: '' }
            ]
          });

          // After `initializeChildCards` has been called
          var surveyCard = card.childCards[0].card;

        Child cards can be added to the DOM by overriding `initializeDOM`.  The
        default behavior of `initializeDOM` is to add all child cards to the body
        element.

        You can pass the configuration to be used with Conductor on the instance used to load
        the child cards. This will be passed to `conductor.configure`.

        Example:

          Conductor.card({
            conductorConfiguration: { allowSameOrigin: true },
            childCards: [
              { url: '../cards/survey', id: 1 , options: {}, data: '' }
            ]
          });

        If you use child cards and `allowSameOrigin`, you'll need to specify in the parent card
        a different url for Conductor.js. This will ensure that the child cards can't access
        their parent.

        Example:

          Conductor.card({
            conductorConfiguration: {
              allowSameOrigin: true
            },
            childCards: [
              { url: '../cards/survey', id: 1 , options: {}, data: '' }
            ]
          });
       */
      initializeChildCards: function( data ) {
        var prop,
            conductorOptions = {};

        if(this.childCards) {
          this.conductor = new Conductor( conductorOptions );

          if( this.conductorConfiguration ) {
            for( prop in this.conductorConfiguration ) {
              this.conductor.configure( prop, this.conductorConfiguration[prop] );
            }
          }

          this.conductor.addDefaultCapability('xhr', MultiplexService.extend({
            upstream: this.consumers.xhr,
            transformRequest: function (requestEventName, data) {
              var base = this.sandbox.options.url;
              if (requestEventName === 'get') {
                data.args = a_map.call(data.args, function (resourceUrl) {
                  var url = PathUtils.cardResourceUrl(base, resourceUrl);
                  return PathUtils.cardResourceUrl(getBase(), url);
                });
              }

              return data;
            }
          }));

          // A child card may not need new services
          if( this.services ) {
            for( prop in this.services) {
              this.conductor.addDefaultCapability(prop, this.services[prop]);
            }
          }

          // Hook if you want to initialize cards that are not yet instantiated
          if( this.loadDataForChildCards ) {
            this.loadDataForChildCards( data );
          }

          for( prop in this.childCards ) {
            var childCardOptions = this.childCards[prop];

            this.conductor.loadData(
              childCardOptions.url,
              childCardOptions.id,
              childCardOptions.data
            );

            childCardOptions.card = this.conductor.load( childCardOptions.url, childCardOptions.id, childCardOptions.options );
          }
        }
      },

      initializeDOM: function () {
        if (this.childCards) {
          a_forEach.call(this.childCards, function(cardInfo) {
            cardInfo.card.appendTo(document.body);
          });
        }
      },

      render: function () {},

      //-----------------------------------------------------------------
      // Internal

      defer: function(callback) {
        var defered = RSVP.defer();
        if (callback) { defered.promise.then(callback).fail( RSVP.rethrow ); }
        return defered;
      },

      activateWhen: function(dataPromise, otherPromises) {
        var card = this;

        return this._waitForActivationDeferral().resolve(RSVP.all([dataPromise].concat(otherPromises)).then(function(resolutions) {
          // Need to think if this called at the right place/time
          // My assumption for the moment is that
          // we don't rely on some initializations done in activate
          if (card.initializeChildCards) { card.initializeChildCards(resolutions[0]); }

          if (card.activate) {
            return card.activate(resolutions[0]);
          }
        }));
      },

      _waitForActivationDeferral: function () {
        if (!this._activationDeferral) {
          this._activationDeferral = RSVP.defer();
          this._activationDeferral.promise.fail( RSVP.rethrow );
        }
        return this._activationDeferral;
      }
    };

    Conductor.card = function(options) {
      return new Card(options);
    };
  });
define("conductor/card_dependencies", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function CardDependencies() {
      this.requiredJavaScriptURLs = [];
      this.requiredCSSURLs = [];
    }

    CardDependencies.prototype = {
      requireJavaScript: function(url) {
        this.requiredJavaScriptURLs.push(url);
      },
      requireCSS: function(url) {
        this.requiredCSSURLs.push(url);
      }
    };

    __exports__["default"] = CardDependencies;
  });
define("conductor/card_reference", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var RSVP = Oasis.RSVP,
        Promise = RSVP.Promise;

    function CardReference(sandbox) {
      this.sandbox = sandbox;
      var card = this;

      return this;
    }

    CardReference.prototype = {
      waitForLoad: function() {
        var card = this;
        if (!this._loadPromise) {
          this._loadPromise = this.sandbox.waitForLoad().then(function() {
            return card;
          }).fail(RSVP.rethrow);
        }
        return this._loadPromise;
      },

      metadataFor: function(name) {
        return this.sandbox.metadataPort.request('metadataFor', name);
      },

      instruct: function(info) {
        return this.sandbox.assertionPort.send('instruct', info);
      },

      appendTo: function(parent) {
        if (typeof parent === 'string') {
          var selector = parent;
          parent = document.querySelector(selector);
          if (!parent) { throw new Error("You are trying to append to '" + selector + "' but no element matching it was found"); }
        }

        parent.appendChild(this.sandbox.el);

        return this.waitForLoad();
      },

      render: function(intent, dimensions) {
        var card = this;

        this.sandbox.activatePromise.then(function() {
          card.sandbox.renderPort.send('render', [intent, dimensions]);
        }).fail(RSVP.rethrow);
      },

      updateData: function(bucket, data) {
        var sandbox = this.sandbox;
        sandbox.activatePromise.then(function() {
          sandbox.dataPort.send('updateData', { bucket: bucket, data: data });
        }).fail(RSVP.rethrow);
      },

      wiretap: function(callback, binding) {
        this.sandbox.wiretap(function() {
          callback.apply(binding, arguments);
        });
      },

      destroy: function() {
        this.sandbox.conductor.unload(this);
      }
    };

    Oasis.RSVP.EventTarget.mixin(CardReference.prototype);

    __exports__["default"] = CardReference;
  });
define("conductor/data_consumer", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var DataConsumer = Oasis.Consumer.extend({
      events: {
        initializeData: function(data) {
          this.card.data = data;
          this.card.deferred.data.resolve(data);
        },

        updateData: function(data) {
          if (data.bucket === '*') {
            this.card.data = data.data;
          } else {
            this.card.data[data.bucket] = data.data;
          }

          if (this.card.didUpdateData) {
            this.card.didUpdateData(data.bucket, data.data);
          }
        }
      }
    });

    __exports__["default"] = DataConsumer;
  });
define("conductor/data_service", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var DataService = Oasis.Service.extend({
      initialize: function(port) {
        var data = this.sandbox.data;
        this.send('initializeData', data);

        this.sandbox.dataPort = port;
      },

      events: {
        updateData: function(event) {
          this.sandbox.conductor.updateData(this.sandbox.card, event.bucket, event.object);
        }
      }
    });

    __exports__["default"] = DataService;
  });
define("conductor/dom", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global DomUtils:true */

    var DomUtils = {};

    if (typeof window !== "undefined") {
      if (window.getComputedStyle) {
        DomUtils.getComputedStyleProperty = function (element, property) {
          return window.getComputedStyle(element)[property];
        };
      } else {
        DomUtils.getComputedStyleProperty = function (element, property) {
          var prop = property.replace(/-(\w)/g, function (_, letter) {
            return letter.toUpperCase();
          });
          return element.currentStyle[prop];
        };
      }
    }

    DomUtils.createStyleElement = function(css) {
      var style = document.createElement('style');

      style.type = 'text/css';
      if (style.styleSheet){
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }

      return style;
    };

    __exports__["default"] = DomUtils;
  });
define("conductor/error", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function error(exception) {
      if (typeof console === 'object' && console.assert && console.error) {
        // chrome does not (yet) link the URLs in `console.assert`
        console.error(exception.stack);
        console.assert(false, exception.message);
      }
      setTimeout( function () {
        throw exception;
      }, 1);
      throw exception;
    }

    __exports__.error = error;function warn() {
      if (console.warn) {
        return console.warn.apply(this, arguments);
      }
    }

    __exports__.warn = warn;
  });
define("conductor/height_consumer", 
  ["oasis","conductor","conductor/dom","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /*global MutationObserver:true */

    /**
      The height consumer reports changes to the `documentElement`'s element to its
      parent environment.  This is obviated by the ALLOWSEAMLESS proposal, but no
      browser supports it yet.

      There are two mechanisms for reporting dimension changes: automatic (via DOM
      mutation observers) and manual.  By default, height resizing is automatic.  It
      must be disabled during card activation if `MutationObserver` is not
      supported.  It may be disabled during card activation if manual updates are
      preferred.

      Automatic updating can be disabled as follows:

      ```js
      Conductor.card({
        activate: function () {
          this.consumers.height.autoUpdate = false;
        }
      })
      ```

      Manual updates can be done either with specific dimensions, or manual updating
      can compute the dimensions.

      ```js
      card = Conductor.card({ ... });

      card.consumers.height.update({ width: 200, height: 200 });

      // dimensions of `document.body` will be computed.
      card.consumers.height.update();
      ```
    */
    var Oasis = __dependency1__["default"];
    var Conductor = __dependency2__["default"];
    var DomUtils = __dependency3__["default"];

    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var HeightConsumer = Oasis.Consumer.extend({
      autoUpdate: true,

      // TODO: fix autoupdate
      // initialize: function () {
        // var consumer = this;

        // this.card.waitForActivation().then(function () {
          // if (!consumer.autoUpdate) {
            // return;
          // } else if (typeof MutationObserver === "undefined") {
            // Conductor.warn("MutationObserver is not defined.  Height service cannot autoupdate.  You must manually call `update` for your height consumer.  You may want to disable autoupdate when your card activates with `this.consumers.height.autoUpdate = false;`");
            // return;
          // }

          // consumer.setUpAutoupdate();
        // });
      // },

      update: function (dimensions) {
        if (typeof dimensions === "undefined") {
          var width = 0,
              height = 0,
              childNodes = document.body.childNodes,
              len = childNodes.length,
              extraVSpace = 0,
              extraHSpace = 0,
              vspaceProps = ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'],
              hspaceProps = ['marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'],
              i,
              childNode;

          for (i=0; i < vspaceProps.length; ++i) {
            extraVSpace += parseInt(DomUtils.getComputedStyleProperty(document.body, vspaceProps[i]), 10);
          }

          for (i=0; i < hspaceProps.length; ++i) {
            extraHSpace += parseInt(DomUtils.getComputedStyleProperty(document.body, hspaceProps[i]), 10);
          }

          for (i = 0; i < len; ++i) {
            childNode = childNodes[i];
            if (childNode.nodeType !== 1 /* Node.ELEMENT_NODE */ ) { continue; }

            width = Math.max(width, childNode.clientWidth + extraHSpace);
            height = Math.max(height, childNode.clientHeight + extraVSpace);
          }

          dimensions = {
            width: width,
            height: height
          };
        }

        this.send('resize', dimensions);
      },

      setUpAutoupdate: function () {
        var consumer = this;

        var mutationObserver = new MutationObserver(function () {
          consumer.update();
        });

        mutationObserver.observe(document.documentElement, {
          childList: true,
          attributes: true,
          characterData: true,
          subtree: true,
          attributeOldValue: false,
          characterDataOldValue: false,
          attributeFilter: ['style', 'className']
        });
      }
    });

    __exports__["default"] = HeightConsumer;
  });
define("conductor/height_service", 
  ["oasis","conductor/dom","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*global DomUtils*/
    var Oasis = __dependency1__["default"];
    var DomUtils = __dependency2__["default"];

    function maxDim(element, dim) {
      var max = DomUtils.getComputedStyleProperty(element, 'max' + dim);
      return (max === "none") ? Infinity : parseInt(max, 10);
    }

    var HeightService = Oasis.Service.extend({
      initialize: function (port) {
        var el;
        if (el = this.sandbox.el) {
          Oasis.RSVP.EventTarget.mixin(el);
        }
        this.sandbox.heightPort = port;
      },

      events: {
        resize: function (data) {
          // height service is meaningless for DOMless sandboxes, eg sandboxed as
          // web workers.
          if (! this.sandbox.el) { return; }

          var el = this.sandbox.el,
              maxWidth = maxDim(el, 'Width'),
              maxHeight = maxDim(el, 'Height'),
              width = Math.min(data.width, maxWidth),
              height = Math.min(data.height, maxHeight);

          el.style.width = width + "px";
          el.style.height = height + "px";

          el.trigger('resize', { width: width, height: height });
        }
      }
    });

    __exports__["default"] = HeightService;
  });
define("conductor/inline_adapter", 
  ["oasis/util","oasis/inline_adapter","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var extend = __dependency1__.extend;
    var OasisInlineAdapter = __dependency2__["default"];

    var InlineAdapter = extend(OasisInlineAdapter, {
      wrapResource: function (data, oasis) {
        var functionDef = 
          'var _globalOasis = window.oasis; window.oasis = oasis;' +
          'try {' +
          data +
          ' } finally {' +
          'window.oasis = _globalOasis;' +
          '}';
        return new Function("oasis", functionDef);
        }
    });

    var inlineAdapter = new InlineAdapter();

    inlineAdapter.addUnsupportedCapability('height');

    __exports__["default"] = inlineAdapter;
  });
define("conductor/lang", 
  ["oasis/shims","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var a_indexOf = __dependency1__.a_indexOf;
    var a_filter = __dependency1__.a_filter;

    function copy(a) {
      var b = {};
      for (var prop in a) {
        if (!a.hasOwnProperty(prop)) { continue; }

        b[prop] = a[prop];
      }
      return b;
    }

    __exports__.copy = copy;function setDiff(a, b) {
      var differences  = [];

      for(var prop in a) {
        if( a[prop] !== b[prop] ) {
          differences.push( prop );
        }
      }

      return differences;
    }

    __exports__.setDiff = setDiff;
  });
define("conductor/lifecycle_consumer", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var LifecycleConsumer = Oasis.Consumer.extend({
      initialize: function() {
        var consumer = this;

        this.card.waitForActivation().then(function() {
          consumer.send('activated');
        });
      }
    });

    __exports__["default"] = LifecycleConsumer;
  });
define("conductor/lifecycle_service", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var LifecycleService = Oasis.Service.extend({
      events: {
        activated: function() {
          this.sandbox.activateDefered.resolve();
        }
      }
    });

    __exports__["default"] = LifecycleService;
  });
define("conductor/metadata_consumer", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var MetadataConsumer = Oasis.Consumer.extend({
      requests: {
        metadataFor: function(name) {
          if (name === '*') {
            var values = [], names = [];

            for (var metadataName in this.card.options.metadata) {
              values.push(this.card.metadata[metadataName].call(this.card));
              names.push(metadataName);
            }

            return Oasis.RSVP.all(values).then(function(sources) {
              var metadata = {};

              for (var i = 0; i < sources.length; i++) {
                var name = names[i];
                for (var key in sources[i]) {
                  metadata[name+':'+key] = sources[i][key];
                }
              }

              return metadata;
            });

          } else {
            return this.card.metadata[name].call(this.card);
          }
        }
      }
    });

    __exports__["default"] = MetadataConsumer;
  });
define("conductor/metadata_service", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var MetadataService = Oasis.Service.extend({
      initialize: function(port) {
        this.sandbox.metadataPort = port;
      }
    });

    __exports__["default"] = MetadataService;
  });
define("conductor/multiplex_service", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /**
      Passes requests from each instance to `upstream`, a
      `Conductor.Oasis.Consumer`, and sends the responses back to the instance.
      This differs from simply passing `upstream`'s port to nested cards in two
      ways:

        1. `upstream` can still be used within the current card and
        2. requests from multiple nested cards can be sent to `upstream`.

      This is useful for cards who cannot fulfill dependency requests of its child
      cards, but whose containing environment can.


      Example:

        Conductor.card({
          activate: function () {
            var conductor = new Conductor();

            // nested conductor cannot load required resources, but its containing
            // environment can (possibly by passing the request up through its own
            // multiplex service).
            conductor.addDefaultCapability('xhr', Conductor.MultiplexService.extend({
                                                    upstream: this.consumers.xhr
                                                  }));

            // now the nested card can `Conductor.require` resources normally.
            conductor.card.load("/nested/card/url.js");
          }
        });
    */

    var Oasis = __dependency1__["default"];

    var MultiplexService = Oasis.Service.extend({
      initialize: function () {
        this.port.all(function (eventName, data) {
          if (eventName.substr(0, "@request:".length) === "@request:") {
            this.propagateRequest(eventName, data);
          } else {
            this.propagateEvent(eventName, data);
          }
        }, this);
      },

      propagateEvent: function (eventName, _data) {
        var data = (typeof this.transformEvent === 'function') ? this.transformEvent(eventName, _data) : _data;
        this.upstream.send(eventName, data);
      },

      propagateRequest: function (eventName, _data) {
        var requestEventName = eventName.substr("@request:".length),
            port = this.upstream.port,
            data = (typeof this.transformRequest === 'function') ? this.transformRequest(requestEventName, _data) : _data,
            requestId = data.requestId,
            args = data.args,
            self = this;

        args.unshift(requestEventName);
        port.request.apply(port, args).then(function (responseData) {
          self.send('@response:' + requestEventName, {
            requestId: requestId,
            data: responseData
          });
        });
      }
    });

    __exports__["default"] = MultiplexService;
  });
define("conductor/nested_wiretapping_consumer", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var NestedWiretapping = Oasis.Consumer;

    __exports__["default"] = NestedWiretapping;
  });
define("conductor/nested_wiretapping_service", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var NestedWiretappingService = Oasis.Service.extend({
      initialize: function (port) {
        this.sandbox.nestedWiretappingPort = port;
      }
    });

    __exports__["default"] = NestedWiretappingService;
  });
define("conductor/path", 
  ["oasis/shims","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global PathUtils:true */
    var a_filter = __dependency1__.a_filter;

    var PathUtils = window.PathUtils = {
      dirname: function (path) {
        return path.substring(0, path.lastIndexOf('/'));
      },

      expandPath: function (path) {
        var parts = path.split('/');
        for (var i = 0; i < parts.length; ++i) {
          if (parts[i] === '..') {
            for (var j = i-1; j >= 0; --j) {
              if (parts[j] !== undefined) {
                parts[i] = parts[j] = undefined;
                break;
              }
            }
          }
        }
        return a_filter.call(parts, function (part) { return part !== undefined; }).join('/');
      },

      cardResourceUrl: function(baseUrl, resourceUrl) {
        var url;
        if (/^((http(s?):)|\/)/.test(resourceUrl)) {
          url = resourceUrl;
        } else {
          url = PathUtils.dirname(baseUrl) + '/' + resourceUrl;
        }

        return PathUtils.expandPath(url);
      }
    };

    __exports__["default"] = PathUtils;
  });
define("conductor/render_consumer", 
  ["oasis","conductor/dom","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*global DomUtils */

    var Oasis = __dependency1__["default"];
    var DomUtils = __dependency2__["default"];

    var domInitialized = false;

    function resetCSS() {
      var head = document.head || document.documentElement.getElementsByTagName('head')[0],
          css = "",
          newStyle;

      css += "body {";
      css += "  margin: 0px;";
      css += "  padding: 0px;";
      css += "}";

      css += "iframe {";
      css += "  display: block;";
      css += "}";

      newStyle = DomUtils.createStyleElement(css);

      head.insertBefore(newStyle, head.children[0]);
    }

    var RenderConsumer = Oasis.Consumer.extend({
      events: {
        render: function(args) {
          if(!domInitialized) {
            resetCSS();

            if(this.card.initializeDOM) {
              this.card.initializeDOM();
            }

            domInitialized = true;
          }
          this.card.render.apply(this.card, args);
        }
      }
    });

    __exports__["default"] = RenderConsumer;
  });
define("conductor/render_service", 
  ["oasis","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];

    var RenderService = Oasis.Service.extend({
      initialize: function(port) {
        this.sandbox.renderPort = port;
      }
    });

    __exports__["default"] = RenderService;
  });
define("conductor/services", 
  ["conductor/assertion_service","conductor/xhr_service","conductor/render_service","conductor/metadata_service","conductor/data_service","conductor/lifecycle_service","conductor/height_service","conductor/nested_wiretapping_service","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var AssertionService = __dependency1__["default"];
    var XhrService = __dependency2__["default"];
    var RenderService = __dependency3__["default"];
    var MetadataService = __dependency4__["default"];
    var DataService = __dependency5__["default"];
    var LifecycleService = __dependency6__["default"];
    var HeightService = __dependency7__["default"];
    var NestedWiretappingService = __dependency8__["default"];

    /**
      Default Conductor services provided to every conductor instance.
    */
    var services = {
      xhr: XhrService,
      metadata: MetadataService,
      assertion: AssertionService,
      render: RenderService,
      lifecycle: LifecycleService,
      data: DataService,
      height: HeightService,
      nestedWiretapping: NestedWiretappingService
    };
    __exports__.services = services;
    var capabilities = [
      'xhr', 'metadata', 'render', 'data', 'lifecycle', 'height',
      'nestedWiretapping'
    ];
    __exports__.capabilities = capabilities;
  });
define("conductor/version", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = '0.3.0';
  });
define("conductor/xhr_consumer", 
  ["oasis","oasis/shims","conductor/dom","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Oasis = __dependency1__["default"];
    var OasisShims = __dependency2__;
    var DomUtils = __dependency3__["default"];

    var a_forEach = OasisShims.a_forEach;

    var XhrConsumer = Oasis.Consumer.extend({
      initialize: function() {
        var promises = [],
            jsPromises = [],
            port = this.port,
            promise = this.card.deferred.xhr;

        function loadURL(callback) {
          return function(url) {
            var promise = port.request('get', url);
            promises.push(promise);
            promise.then(callback);
          };
        }

        function processJavaScript(data) {
          var script = document.createElement('script');
          var head = document.head || document.documentElement.getElementsByTagName('head')[0];
          // textContent is ie9+
          script.text = script.textContent = data;
          head.appendChild(script);
        }

        function processCSS(data) {
          var head = document.head || document.documentElement.getElementsByTagName('head')[0],
              style = DomUtils.createStyleElement(data);
          head.appendChild(style);
        }

        a_forEach.call(Conductor._dependencies.requiredJavaScriptURLs, function( url ) {
          var promise = port.request('get', url);
          jsPromises.push( promise );
          promises.push(promise);
        });
        Oasis.RSVP.all(jsPromises).then(function(scripts) {
          a_forEach.call(scripts, processJavaScript);
        }).fail( Oasis.RSVP.rethrow );
        a_forEach.call(Conductor._dependencies.requiredCSSURLs, loadURL(processCSS));

        Oasis.RSVP.all(promises).then(function() { promise.resolve(); }).fail( Oasis.RSVP.rethrow );
      }
    });

    __exports__["default"] = XhrConsumer;
  });
define("conductor/xhr_service", 
  ["oasis","conductor/path","oasis/xhr","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /*global PathUtils */
    var Oasis = __dependency1__["default"];
    var PathUtils = __dependency2__["default"];
    var xhr = __dependency3__.xhr;

    var XhrService = Oasis.Service.extend({
      requests: {
        get: function(url) {
          var service = this;
          var resourceUrl = PathUtils.cardResourceUrl(service.sandbox.options.url, url);

          return xhr(resourceUrl);
        }
      }
    });

    __exports__["default"] = XhrService;
  });
define("oasis", 
  ["rsvp","oasis/logger","oasis/version","oasis/util","oasis/config","oasis/sandbox","oasis/sandbox_init","oasis/xhr","oasis/events","oasis/service","oasis/connect","oasis/iframe_adapter","oasis/webworker_adapter","oasis/inline_adapter","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __exports__) {
    "use strict";
    var RSVP = __dependency1__;
    var logger = __dependency2__["default"];
    var Version = __dependency3__["default"];
    var assert = __dependency4__.assert;
    var delegate = __dependency4__.delegate;
    var OasisConfiguration = __dependency5__["default"];
    var Sandbox = __dependency6__["default"];
    var autoInitializeSandbox = __dependency7__["default"];
    var xhr = __dependency8__.xhr;
    var Events = __dependency9__["default"];

    var Service = __dependency10__["default"];
    var connect = __dependency11__.connect;
    var connectCapabilities = __dependency11__.connectCapabilities;
    var portFor = __dependency11__.portFor;

    var IframeAdapter = __dependency12__["default"];
    var WebworkerAdapter = __dependency13__["default"];
    var InlineAdapter = __dependency14__["default"];

    function Oasis() {
      // Data structures used by Oasis when creating sandboxes
      this.packages = {};
      this.requestId = 0;
      this.oasisId = 'oasis' + (+new Date());

      this.consumers = {};
      this.services = [];

      // Data structures used when connecting to a parent sandbox
      this.ports = {};
      this.handlers = {};

      this.receivedPorts = false;

      this.configuration = new OasisConfiguration();
      this.events = new Events();

      this.didCreate();
    }

    Oasis.Version = Version;
    Oasis.Service = Oasis.Consumer = Service;
    Oasis.RSVP = RSVP;

    Oasis.reset = function () {
      Oasis.adapters = {
        iframe: new IframeAdapter(),
        webworker: new WebworkerAdapter(),
        inline: new InlineAdapter()
      };
    };

    Oasis.reset();

    Oasis.prototype = {
      logger: logger,
      log: function () {
        this.logger.log.apply(this.logger, arguments);
      },

      on: delegate('events', 'on'),
      off: delegate('events', 'off'),
      trigger: delegate('events', 'trigger'),

      didCreate: function() {},

      xhr: xhr,

      /**
        This is the entry point that allows the containing environment to create a
        child sandbox.

        Options:

        * `capabilities`: an array of registered services
        * `url`: a registered URL to a JavaScript file that will initialize the
          sandbox in the sandboxed environment
        * `adapter`: a reference to an adapter that will handle the lifecycle
          of the sandbox. Right now, there are iframe and web worker adapters.

        @param {Object} options
      */
      createSandbox: function (options) {
        return new Sandbox(this, options);
      },

      /**
        This registers a sandbox type inside of the containing environment so that
        it can be referenced by URL in `createSandbox`.

        Options:

        * `capabilities`: An array of service names that will be supplied when calling
          `createSandbox`
        * `url`: The URL of the JavaScript file that contains the sandbox code

        @param {Object} options
      */
      register: function (options) {
        assert(options.capabilities, "You are trying to register a package without any capabilities. Please provide a list of requested capabilities, or an empty array ([]).");

        this.packages[options.url] = options;
      },

      configure: function(name, value) { this.configuration[name] = value; },
      autoInitializeSandbox: autoInitializeSandbox,

      connect: connect,
      connectCapabilities: connectCapabilities,
      portFor: portFor
    };


    __exports__["default"] = Oasis;
  });
define("oasis/base_adapter", 
  ["rsvp","oasis/logger","oasis/util","oasis/shims","oasis/connect","oasis/message_channel","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var RSVP = __dependency1__;

    var Logger = __dependency2__["default"];
    var mustImplement = __dependency3__.mustImplement;
    var addEventListener = __dependency4__.addEventListener;
    var removeEventListener = __dependency4__.removeEventListener;
    var a_indexOf = __dependency4__.a_indexOf;
    var a_filter = __dependency4__.a_filter;

    var connectCapabilities = __dependency5__.connectCapabilities;
    var PostMessageMessageChannel = __dependency6__.PostMessageMessageChannel;

    function BaseAdapter() {
      this._unsupportedCapabilities = [];
    }

    BaseAdapter.prototype = {
      initializeSandbox: mustImplement('BaseAdapter', 'initializeSandbox'),
      name: mustImplement('BaseAdapter', 'name'),

      unsupportedCapabilities: function () {
        return this._unsupportedCapabilities;
      },

      addUnsupportedCapability: function (capability) {
        this._unsupportedCapabilities.push(capability);
      },

      filterCapabilities: function(capabilities) {
        var unsupported = this._unsupportedCapabilities;
        return a_filter.call(capabilities, function (capability) {
          var index = a_indexOf.call(unsupported, capability);
          return index === -1;
        });
      },

      createChannel: function(oasis) {
        var channel = new PostMessageMessageChannel(oasis);
        channel.port1.start();
        return channel;
      },

      environmentPort: function(sandbox, channel) {
        return channel.port1;
      },

      sandboxPort: function(sandbox, channel) {
        return channel.port2;
      },

      proxyPort: function(sandbox, port) {
        return port;
      },

      connectSandbox: function (receiver, oasis) {
        var adapter = this;

        Logger.log("Sandbox listening for initialization message");

        function initializeOasisSandbox(event) {
          if (!event.data.isOasisInitialization) { return; }

          removeEventListener(receiver, 'message', initializeOasisSandbox);
          adapter.initializeOasisSandbox(event, oasis);
        }
        addEventListener(receiver, 'message', initializeOasisSandbox);

        adapter.oasisLoaded(oasis);
      },

      initializeOasisSandbox: function (event, oasis) {
        var adapter = this;
        oasis.configuration.eventCallback(function () {
          Logger.log("sandbox: received initialization message.");

          oasis.connectCapabilities(event.data.capabilities, event.ports);

          adapter.didConnect(oasis);
        });
      },

      createInitializationMessage: function (sandbox) {
        return {
          isOasisInitialization: true,
          capabilities: sandbox._capabilitiesToConnect,
        };
      },

      oasisLoadedMessage: "oasisSandboxLoaded",
      sandboxInitializedMessage:  "oasisSandboxInitialized"
    };

    __exports__["default"] = BaseAdapter;
  });
define("oasis/config", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      Stores Oasis configuration.  Options include:

      - `eventCallback` - a function that wraps `message` event handlers.  By
        default the event hanlder is simply invoked.
      - `allowSameOrigin` - a card can be hosted on the same domain
      - `reconnect` - the default reconnect options for iframe sandboxes.  Possible values are:
        - "none" - do not allow sandbox reconnection
        - "verify" - only allow reconnections from the original origin of the sandbox
        - "any" - allow any sandbox reconnections.  Only use this setting if you are
          using Oasis strictly for isolation of trusted applications or if it's safe
          to connect your sandbox to arbitrary origins.  This is an advanced setting
          and should be used with care.
    */
    function OasisConfiguration() {
      this.eventCallback = function (callback) { callback(); };
      this.allowSameOrigin = false;
      this.reconnect = 'verify';
    }

    __exports__["default"] = OasisConfiguration;
  });
define("oasis/connect", 
  ["rsvp","oasis/logger","oasis/util","oasis/shims","oasis/message_channel","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var RSVP = __dependency1__;
    var Logger = __dependency2__["default"];
    var assert = __dependency3__.assert;
    var a_forEach = __dependency4__.a_forEach;

    var PostMessagePort = __dependency5__.PostMessagePort;

    function registerHandler(oasis, capability, options) {
      var port = oasis.ports[capability];

      if (port) {
        Logger.log(oasis.oasisId, "sandbox: found port, setting up '" + capability + "'");
        options.setupCapability(port);

        if (options.promise) {
          options.promise.then(function() {
            port.start();
          }).fail(RSVP.rethrow);
        } else {
          port.start();
        }
      } else if (!oasis.receivedPorts) {
        Logger.log("No port found, saving handler for '" + capability + "'");
        oasis.handlers[capability] = options;
      } else {
        Logger.log("No port was sent for capability '" + capability + "'");
        options.rejectCapability();
      }
    }

    __exports__.registerHandler = registerHandler;/**
      This is the main entry point that allows sandboxes to connect back
      to their containing environment.

      It can be called either with a set of named consumers, with callbacks, or using promises.

      Example

        // Using promises
        Oasis.connect('foo').then( function (port) {
          port.send('hello');
        }, function () {
          // error
        });


        // using callbacks
        Oasis.connect('foo', function (port) {
          port.send('hello');
        }, errorHandler);


        // connecting several consumers at once.
        var ConsumerA = Oasis.Consumer.extend({
          initialize: function (port) { this.port = port; },

          error: function () { }
        });

        var ConsumerB = Oasis.Consumer.extend({
          initialize: function (port) { this.port = port; },

          error: function () { }
        });

        Oasis.connect({
          consumers: {
            capabilityA: ConsumerA,
            capabilityB: ConsumerB
          }
        });

      @param {String} capability the name of the service to connect to, or an object
        containing named consumers to connect.
      @param {Function?} callback the callback to trigger once the other
        side of the connection is available.
      @param {Function?} errorCallback the callback to trigger if the capability is
        not provided by the environment.
      @return {Promise} a promise that will be resolved once the other
        side of the connection is available. You can use this instead
        of the callbacks.
    */
    function connect(capability, callback, errorCallback) {
      if (typeof capability === 'object') {
        return connectConsumers(this, capability.consumers);
      } else if (callback) {
        return connectCallbacks(this, capability, callback, errorCallback);
      } else {
        return connectPromise(this, capability);
      }
    }

    __exports__.connect = connect;function connectCapabilities(capabilities, eventPorts) {
      var oasis = this;
      a_forEach.call(capabilities, function(capability, i) {
        var handler = oasis.handlers[capability],
            port = new PostMessagePort(oasis, eventPorts[i]);

        if (handler) {
          Logger.log("Invoking handler for '" + capability + "'");

          RSVP.resolve(handler.setupCapability(port)).then(function () {
            port.start();
          }).fail(RSVP.rethrow);
        }

        oasis.ports[capability] = port;
      });

      // for each handler w/o capability, reject
      for( var prop in oasis.handlers ) {
        if( ! oasis.ports[prop] ) {
          oasis.handlers[prop].rejectCapability();
        }
      }

      this.receivedPorts = true;
    }

    __exports__.connectCapabilities = connectCapabilities;function portFor(capability) {
      var port = this.ports[capability];
      assert(port, "You asked for the port for the '" + capability + "' capability, but the environment did not provide one.");
      return port;
    }

    __exports__.portFor = portFor;
    function connectConsumers(oasis, consumers) {
      function setupCapability(Consumer, name) {
        return function(port) {
          var consumer = new Consumer(port);
          oasis.consumers[name] = consumer;
          consumer.initialize(port, name);
        };
      }

      function rejectCapability(prop) {
        return function () {
          consumers[prop].prototype.error();
        };
      }

      for (var prop in consumers) {
        registerHandler(oasis, prop, {
          setupCapability: setupCapability(consumers[prop], prop),
          rejectCapability: rejectCapability(prop)
        });
      }
    }

    function connectCallbacks(oasis, capability, callback, errorCallback) {
      Logger.log("Connecting to '" + capability + "' with callback.");

      registerHandler(oasis, capability, {
        setupCapability: function(port) {
          callback(port);
        },
        rejectCapability: function () {
          if (errorCallback) {
            errorCallback();
          }
        }
      });
    }

    function connectPromise(oasis, capability) {
      Logger.log("Connecting to '" + capability + "' with promise.");

      var defered = RSVP.defer();
      registerHandler(oasis, capability, {
        promise: defered.promise,
        setupCapability: function(port) {
          defered.resolve(port);
          return defered.promise;
        },
        rejectCapability: function () {
          defered.reject();
        }
      });
      return defered.promise;
    }
  });
define("oasis/events", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var a_slice = Array.prototype.slice;

    function Events() {
      this.listenerArrays = {};
    }

    Events.prototype = {
      on: function (eventName, listener) {
        var listeners = this.listenerArrays[eventName] = this.listenerArrays[eventName] || [];

        listeners.push(listener);
      },

      off: function (eventName, listener) {
        var listeners = this.listenerArrays[eventName];
        if (!listeners) { return; }

        for (var i=0; i<listeners.length; ++i) {
          if (listeners[i] === listener) {
            listeners.splice(i, 1);
            break;
          }
        }
      },

      clear: function(eventName) {
        delete this.listenerArrays[eventName];
      },

      trigger: function(eventName) {
        var listeners = this.listenerArrays[eventName];
        if (!listeners) { return; }

        var args = a_slice.call(arguments, 1);

        for (var i=0; i<listeners.length; ++i) {
          listeners[i].apply(null, args);
        }
      }
    };

    __exports__["default"] = Events;
  });
define("oasis/iframe_adapter", 
  ["rsvp","oasis/logger","oasis/util","oasis/shims","oasis/base_adapter","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    /*global Window, UUID */

    var RSVP = __dependency1__;
    var Logger = __dependency2__["default"];
    var assert = __dependency3__.assert;
    var extend = __dependency3__.extend;
    var a_forEach = __dependency4__.a_forEach;
    var addEventListener = __dependency4__.addEventListener;
    var removeEventListener = __dependency4__.removeEventListener;
    var a_map = __dependency4__.a_map;

    var BaseAdapter = __dependency5__["default"];

    function verifySandbox(oasis, sandboxUrl) {
      var iframe = document.createElement('iframe'),
          link;

      if( (oasis.configuration.allowSameOrigin && iframe.sandbox !== undefined) ||
          (iframe.sandbox === undefined) ) {
        // The sandbox attribute isn't supported (IE8/9) or we want a child iframe
        // to access resources from its own domain (youtube iframe),
        // we need to make sure the sandbox is loaded from a separate domain
        link = document.createElement('a');
        link.href = sandboxUrl;

        if( !link.host || (link.protocol === window.location.protocol && link.host === window.location.host) ) {
          throw new Error("Security: iFrames from the same host cannot be sandboxed in older browsers and is disallowed.  " +
                          "For HTML5 browsers supporting the `sandbox` attribute on iframes, you can add the `allow-same-origin` flag" +
                          "only if you host the sandbox on a separate domain.");
        }
      }
    }

    function verifyCurrentSandboxOrigin(sandbox, event) {
      var linkOriginal, linkCurrent;

      if (sandbox.firstLoad || sandbox.options.reconnect === "any") {
        return true;
      }

      if (!sandbox.oasis.configuration.allowSameOrigin || event.origin === "null") {
        fail();
      } else {
        linkOriginal = document.createElement('a');
        linkCurrent = document.createElement('a');

        linkOriginal.href = sandbox.options.url;
        linkCurrent.href = event.origin;

        if (linkCurrent.protocol === linkOriginal.protocol &&
            linkCurrent.host === linkOriginal.host) {
          return true;
        }

        fail();
      }

      function fail() {
        sandbox.onerror(
          new Error("Cannot reconnect null origins unless `reconnect` is set to " +
                    "'any'.  `reconnect: 'verify' requires `allowSameOrigin: " +
                    "true`"));
      }
    }

    function isUrl(s) {
      var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
      return regexp.test(s);
    }

    var IframeAdapter = extend(BaseAdapter, {
      //-------------------------------------------------------------------------
      // Environment API

      initializeSandbox: function(sandbox) {
        var options = sandbox.options,
            iframe = document.createElement('iframe'),
            sandboxAttributes = ['allow-scripts'];

        if( sandbox.oasis.configuration.allowSameOrigin ) {
          sandboxAttributes.push('allow-same-origin');
        }
        if( options && options.sandbox && options.sandbox.popups ) {
          sandboxAttributes.push('allow-popups');
        }

        iframe.name = sandbox.options.url + '?uuid=' + UUID.generate();
        iframe.sandbox = sandboxAttributes.join(' ');
        iframe.seamless = true;

        // rendering-specific code
        if (options.width) {
          iframe.width = options.width;
        } else if (options.height) {
          iframe.height = options.height;
        }

        // Error handling inside the iFrame
        iframe.errorHandler = function(event) {
          if(!event.data.sandboxException) {return;}
          try {
            // verify this message came from the expected sandbox; try/catch
            // because ie8 will disallow reading contentWindow in the case of
            // another sandbox's message
            if( event.source !== iframe.contentWindow ) {return;}
          } catch(e) {
            return;
          }

          sandbox.onerror( event.data.sandboxException );
        };
        addEventListener(window, 'message', iframe.errorHandler);

        verifySandbox( sandbox.oasis, sandbox.options.url );
        iframe.src = sandbox.options.url;

        Logger.log('Initializing sandbox ' + iframe.name);

        // Promise that sandbox has loaded and capabilities connected at least once.
        // This does not mean that the sandbox will be loaded & connected in the
        // face of reconnects (eg pages that navigate)
        sandbox._waitForLoadDeferred().resolve(new RSVP.Promise( function(resolve, reject) {
          iframe.initializationHandler = function (event) {
            if( event.data !== sandbox.adapter.sandboxInitializedMessage ) {return;}
            try {
              // verify this message came from the expected sandbox; try/catch
              // because ie8 will disallow reading contentWindow in the case of
              // another sandbox's message
              if( event.source !== iframe.contentWindow ) {return;}
            } catch(e) {
              return;
            }
            removeEventListener(window, 'message', iframe.initializationHandler);

            sandbox.oasis.configuration.eventCallback(function () {
              Logger.log("container: iframe sandbox has initialized (capabilities connected)");
              resolve(sandbox);
            });
          };
          addEventListener(window, 'message', iframe.initializationHandler);
        }));

        sandbox.el = iframe;

        iframe.oasisLoadHandler = function (event) {
          if( event.data !== sandbox.adapter.oasisLoadedMessage ) {return;}
          try {
            // verify this message came from the expected sandbox; try/catch
            // because ie8 will disallow reading contentWindow in the case of
            // another sandbox's message
            if( event.source !== iframe.contentWindow ) {return;}
          } catch(e) {
            return;
          }

          Logger.log("container: iframe sandbox has loaded Oasis");


          if (verifyCurrentSandboxOrigin(sandbox, event)) {
            sandbox.createAndTransferCapabilities();
          }

          if (sandbox.options.reconnect === "none") {
            removeEventListener(window, 'message', iframe.oasisLoadHandler);
          }
        };
        addEventListener(window, 'message', iframe.oasisLoadHandler);
      },

      startSandbox: function(sandbox) {
        var head = document.head || document.documentElement.getElementsByTagName('head')[0];
        head.appendChild(sandbox.el);
      },

      terminateSandbox: function(sandbox) {
        var el = sandbox.el;

        sandbox.terminated = true;

        if (el.loadHandler) {
          // no load handler for HTML sandboxes
          removeEventListener(el, 'load', el.loadHandler);
        }
        removeEventListener(window, 'message', el.initializationHandler);
        removeEventListener(window, 'message', el.oasisLoadHandler);

        if (el.parentNode) {
          Logger.log("Terminating sandbox ", sandbox.el.name);
          el.parentNode.removeChild(el);
        }

        sandbox.el = null;
      },

      connectPorts: function(sandbox, ports) {
        var rawPorts = a_map.call(ports, function(port) { return port.port; }),
            message = this.createInitializationMessage(sandbox);

        if (sandbox.terminated) { return; }
        Window.postMessage(sandbox.el.contentWindow, message, '*', rawPorts);
      },

      //-------------------------------------------------------------------------
      // Sandbox API

      connectSandbox: function(oasis) {
        return BaseAdapter.prototype.connectSandbox.call(this, window, oasis);
      },

      oasisLoaded: function() {
        window.parent.postMessage(this.oasisLoadedMessage, '*', []);
      },

      didConnect: function() {
        window.parent.postMessage(this.sandboxInitializedMessage, '*', []);
      },

      name: function(sandbox) {
        return sandbox.el.name;
      }

    });

    __exports__["default"] = IframeAdapter;
  });
define("oasis/inline_adapter", 
  ["rsvp","oasis/logger","oasis/util","oasis/config","oasis/shims","oasis/xhr","oasis/base_adapter","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    /*global self, postMessage, importScripts */

    var RSVP = __dependency1__;
    var Logger = __dependency2__["default"];
    var assert = __dependency3__.assert;
    var extend = __dependency3__.extend;
    var noop = __dependency3__.noop;
    var configuration = __dependency4__.configuration;
    var a_forEach = __dependency5__.a_forEach;
    var a_map = __dependency5__.a_map;
    var xhr = __dependency6__.xhr;

    var BaseAdapter = __dependency7__["default"];

    var InlineAdapter = extend(BaseAdapter, {
      //-------------------------------------------------------------------------
      // Environment API

      initializeSandbox: function(sandbox) {
        sandbox.el = document.createElement('div');

        var oasis = sandbox.sandboxedOasis = new Oasis();
        sandbox.sandboxedOasis.sandbox = sandbox;
        // When we upgrade RSVP we can change this to `RSVP.async`
        RSVP.resolve().then(function () {
          sandbox.createAndTransferCapabilities();
        });
      },
     
      startSandbox: function(sandbox) {
        var body = document.body || document.documentElement.getElementsByTagName('body')[0];
        body.appendChild(sandbox.el);
      },

      terminateSandbox: function(sandbox) {
        var el = sandbox.el;

        if (el.parentNode) {
          Logger.log("Terminating sandbox ", sandbox.el.name);
          el.parentNode.removeChild(el);
        }

        sandbox.el = null;
      },

      connectPorts: function(sandbox, ports) {
        var rawPorts = a_map.call(ports, function(oasisPort){ return oasisPort.port; }),
            message = this.createInitializationMessage(sandbox),
            event = { data: message, ports: rawPorts };

        // Normally `connectSandbox` is called in autoinitialization, but there
        // isn't a real sandbox here.
        this.connectSandbox(sandbox.sandboxedOasis, event);
      },

      fetchResource: function (url, oasis) {
        var adapter = this;

        return xhr(url, {
          dataType: 'text'
        }, oasis).then(function (code) {
          return adapter.wrapResource(code);
        }).fail(RSVP.rethrow);
      },

      wrapResource: function (code) {
        return new Function("oasis", code);
      },

      //-------------------------------------------------------------------------
      // Sandbox API

      connectSandbox: function(oasis, pseudoEvent) {
        return this.initializeOasisSandbox(pseudoEvent, oasis);
      },

      oasisLoaded: noop,

      didConnect: function(oasis) {
        var adapter = this;

        return oasis.sandbox._waitForLoadDeferred().resolve(loadSandboxJS().fail(RSVP.rethrow));

        function applySandboxJS(sandboxFn) {
          Logger.log("sandbox: inline sandbox initialized");
          sandboxFn(oasis);
          return oasis.sandbox;
        }

        function loadSandboxJS() {
          return new RSVP.Promise(function (resolve, reject) {
            resolve(adapter.fetchResource(oasis.sandbox.options.url, oasis).
              then(applySandboxJS));
          });
        }
      },
    });

    __exports__["default"] = InlineAdapter;
  });
define("oasis/logger", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function Logger() {
      this.enabled = false;
    }

    Logger.prototype = {
      enable: function () {
        this.enabled = true;
      },

      disable: function () {
        this.enabled = false;
      },

      log: function () {
        if (logger.enabled) {
          if (typeof console !== 'undefined' && typeof console.log === 'function') {
            console.log.apply(console, arguments);
          } else if (typeof console !== 'undefined' && typeof console.log === 'object') {
            // Log in IE
            try {
              switch (arguments.length) {
                case 1:
                  console.log(arguments[0]);
                  break;
                case 2:
                  console.log(arguments[0], arguments[1]);
                  break;
                default:
                  console.log(arguments[0], arguments[1], arguments[2]);
              }
            } catch(e) {}
          }
        }
      }
    };

    var logger = new Logger();

    __exports__["default"] = logger;
  });
define("oasis/message_channel", 
  ["rsvp","oasis/util","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var RSVP = __dependency1__;
    var extend = __dependency2__.extend;
    var mustImplement = __dependency2__.mustImplement;

    /**
      OasisPort is an interface that adapters can use to implement ports.
      Ports are passed into the `initialize` method of services and consumers,
      and are available as `this.port` on services and consumers.

      Ports are the low-level API that can be used to communicate with the
      other side of a connection. In general, you will probably want to use
      the `events` and `requests` objects inside your service or consumer
      rather than manually listen for events and requests.

      @constructor
      @param {OasisPort} oasis
      @param {OasisPort} port
    */
    function OasisPort(oasis, port) {}

    __exports__.OasisPort = OasisPort;
    function getRequestId(oasis) {
      return oasis.oasisId + '-' + oasis.requestId++;
    }

    OasisPort.prototype = {
      /**
        This allows you to register an event handler for a particular event
        name.

        @param {String} eventName the name of the event
        @param {Function} callback the callback to call when the event occurs
        @param {any?} binding an optional value of `this` inside of the callback
      */
      on: mustImplement('OasisPort', 'on'),

      /**
        Allows you to register an event handler that is called for all events
        that are sent to the port.
      */
      all: mustImplement('OasisPort', 'all'),

      /**
        This allows you to unregister an event handler for an event name
        and callback. You should not pass in the optional binding.

        @param {String} eventName the name of the event
        @param {Function} callback a reference to the callback that was
          passed into `.on`.
      */
      off: mustImplement('OasisPort', 'off'),

      /**
        This method sends an event to the other side of the connection.

        @param {String} eventName the name of the event
        @param {Structured?} data optional data to pass along with the event
      */
      send: mustImplement('OasisPort', 'send'),

      /**
        @private

        Adapters should implement this to start receiving messages from the
        other side of the connection.

        It is up to the adapter to make sure that no messages are dropped if
        they are sent before `start` is called.
      */
      start: mustImplement('OasisPort', 'start'),

      /**
        @private

        Adapters should implement this to stop receiving messages from the
        other side of the connection.
      */
      close: mustImplement('OasisPort', 'close'),

      /**
        This method sends a request to the other side of the connection.

        @param {String} requestName the name of the request
        @return {Promise} a promise that will be resolved with the value
          provided by the other side of the connection, or rejected if the other
          side indicates retrieving the value resulted in an error. The fulfillment
          value must be structured data.
      */
      request: function(eventName) {
        var oasis = this.oasis;
        var port = this;
        var args = [].slice.call(arguments, 1);

        return new RSVP.Promise(function (resolve, reject) {
          var requestId = getRequestId(oasis);

          var clearObservers = function () {
            port.off('@response:' + eventName, observer);
            port.off('@errorResponse:' + eventName, errorObserver);
          };

          var observer = function(event) {
            if (event.requestId === requestId) {
              clearObservers();
              resolve(event.data);
            }
          };

          var errorObserver = function (event) {
            if (event.requestId === requestId) {
              clearObservers();
              reject(event.data);
            }
          };

          port.on('@response:' + eventName, observer, port);
          port.on('@errorResponse:' + eventName, errorObserver, port);
          port.send('@request:' + eventName, { requestId: requestId, args: args });
        });
      },

      /**
        This method registers a callback to be called when a request is made
        by the other side of the connection.

        The callback will be called with any arguments passed in the request.  It
        may either return a value directly, or return a promise if the value must be
        retrieved asynchronously.

        Examples:

          // This completes the request immediately.
          service.onRequest('name', function () {
            return 'David';
          });


          // This completely the request asynchronously.
          service.onRequest('name', function () {
            return new Oasis.RSVP.Promise(function (resolve, reject) {
              setTimeout( function() {
                resolve('David');
              }, 200);
            });
          });

        @param {String} requestName the name of the request
        @param {Function} callback the callback to be called when a request
          is made.
        @param {any?} binding the value of `this` in the callback
      */
      onRequest: function(eventName, callback, binding) {
        var self = this;

        this.on('@request:' + eventName, function(data) {
          var requestId = data.requestId,
              args = data.args,
              getResponse = new RSVP.Promise(function (resolve, reject) {
                var value = callback.apply(binding, data.args);
                if (undefined !== value) {
                  resolve(value);
                } else {
                  reject("@request:" + eventName + " [" + data.requestId + "] did not return a value.  If you want to return a literal `undefined` return `RSVP.resolve(undefined)`");
                }
              });

          getResponse.then(function (value) {
            self.send('@response:' + eventName, {
              requestId: requestId,
              data: value
            });
          }, function (error) {
            var value = error;
            if (error instanceof Error) {
              value = {
                message: error.message,
                stack: error.stack
              };
            }
            self.send('@errorResponse:' + eventName, {
              requestId: requestId,
              data: value
            });
          });
        });
      }
    };


    function OasisMessageChannel(oasis) {}

    OasisMessageChannel.prototype = {
      start: mustImplement('OasisMessageChannel', 'start')
    };


    var PostMessageMessageChannel = extend(OasisMessageChannel, {
      initialize: function(oasis) {
        this.channel = new MessageChannel();
        this.port1 = new PostMessagePort(oasis, this.channel.port1);
        this.port2 = new PostMessagePort(oasis, this.channel.port2);
      },

      start: function() {
        this.port1.start();
        this.port2.start();
      },

      destroy: function() {
        this.port1.close();
        this.port2.close();
        delete this.port1;
        delete this.port2;
        delete this.channel;
      }
    });
    __exports__.PostMessageMessageChannel = PostMessageMessageChannel;
    var PostMessagePort = extend(OasisPort, {
      initialize: function(oasis, port) {
        this.oasis = oasis;
        this.port = port;
        this._callbacks = [];
      },

      on: function(eventName, callback, binding) {
        var oasis = this.oasis;

        function wrappedCallback(event) {
          if (event.data.type === eventName) {
            oasis.configuration.eventCallback(function () {
              return callback.call(binding, event.data.data);
            });
          }
        }

        this._callbacks.push([callback, wrappedCallback]);
        this.port.addEventListener('message', wrappedCallback);
      },

      all: function(callback, binding) {
        var oasis = this.oasis;

        function wrappedCallback(event) {
          oasis.configuration.eventCallback(function () {
            callback.call(binding, event.data.type, event.data.data);
          });
        }

        this.port.addEventListener('message', wrappedCallback);
      },

      off: function(eventName, callback) {
        var foundCallback;

        for (var i=0, l=this._callbacks.length; i<l; i++) {
          foundCallback = this._callbacks[i];
          if (foundCallback[0] === callback) {
            this.port.removeEventListener('message', foundCallback[1]);
          }
        }
      },

      send: function(eventName, data) {
        this.port.postMessage({
          type: eventName,
          data: data
        });
      },

      start: function() {
        this.port.start();
      },

      close: function() {
        var foundCallback;

        for (var i=0, l=this._callbacks.length; i<l; i++) {
          foundCallback = this._callbacks[i];
          this.port.removeEventListener('message', foundCallback[1]);
        }
        this._callbacks = [];

        this.port.close();
      }
    });
    __exports__.PostMessagePort = PostMessagePort;
  });
define("oasis/sandbox", 
  ["rsvp","oasis/logger","oasis/util","oasis/shims","oasis/message_channel","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var RSVP = __dependency1__;
    var Logger = __dependency2__["default"];
    var assert = __dependency3__.assert;
    var uniq = __dependency3__.uniq;
    var reverseMerge = __dependency3__.reverseMerge;
    var a_forEach = __dependency4__.a_forEach;
    var a_reduce = __dependency4__.a_reduce;
    var a_filter = __dependency4__.a_filter;

    var OasisPort = __dependency5__.OasisPort;

    var OasisSandbox = function(oasis, options) {
      options = reverseMerge(options || {}, {
        reconnect: oasis.configuration.reconnect
      });

      var reconnect = options.reconnect;
      assert( reconnect === "none" || reconnect === "verify" || reconnect === "any",
              "`reconnect` must be one of 'none', 'verify' or 'any'.  '" + reconnect + "' is invalid.");

      this.connections = {};
      this.wiretaps = [];

      this.oasis = oasis;

      // Generic capabilities code
      var pkg = oasis.packages[options.url];

      var capabilities = options.capabilities;
      if (!capabilities) {
        assert(pkg, "You are trying to create a sandbox from an unregistered URL without providing capabilities. Please use Oasis.register to register your package or pass a list of capabilities to createSandbox.");
        capabilities = pkg.capabilities;
      }

      pkg = pkg || {};

      this.adapter = options.adapter || Oasis.adapters.iframe;

      this._capabilitiesToConnect = this._filterCapabilities(capabilities);
      this.envPortDefereds = {};
      this.sandboxPortDefereds = {};
      this.channels = {};
      this.capabilities = {};
      this.options = options;
      this.firstLoad = true;

      var sandbox = this;
      this.promisePorts();
      this.adapter.initializeSandbox(this);
    };

    OasisSandbox.prototype = {
      waitForLoad: function () {
        return this._waitForLoadDeferred().promise;
      },

      wiretap: function(callback) {
        this.wiretaps.push(callback);
      },

      connect: function(capability) {
        var portPromise = this.envPortDefereds[capability].promise;

        assert(portPromise, "Connect was called on '" + capability + "' but no such capability was registered.");

        return portPromise;
      },

      createAndTransferCapabilities: function () {
        if (!this.firstLoad) { this.promisePorts(); }

        this.createChannels();
        this.connectPorts();

        // subsequent calls to `createAndTransferCapabilities` requires new port promises
        this.firstLoad = false;
      },

      promisePorts: function () {
        a_forEach.call(this._capabilitiesToConnect, function(capability) {
          this.envPortDefereds[capability] = RSVP.defer();
          this.sandboxPortDefereds[capability] = RSVP.defer();
        }, this);
      },

      createChannels: function () {
        var sandbox = this,
            services = this.options.services || {},
            channels = this.channels;
        a_forEach.call(this._capabilitiesToConnect, function (capability) {

          Logger.log("container: Will create port for '" + capability + "'");
          var service = services[capability],
              channel, port;

          // If an existing port is provided, just
          // pass it along to the new sandbox.

          // TODO: This should probably be an OasisPort if possible
          if (service instanceof OasisPort) {
            port = this.adapter.proxyPort(this, service);
            this.capabilities[capability] = service;
          } else {
            channel = channels[capability] = this.adapter.createChannel(sandbox.oasis);

            var environmentPort = this.adapter.environmentPort(this, channel),
                sandboxPort = this.adapter.sandboxPort(this, channel);

            Logger.log("container: Wiretapping '" + capability + "'");

            environmentPort.all(function(eventName, data) {
              a_forEach.call(this.wiretaps, function(wiretap) {
                wiretap(capability, {
                  type: eventName,
                  data: data,
                  direction: 'received'
                });
              });
            }, this);

            a_forEach.call(this.wiretaps, function(wiretap) {
              var originalSend = environmentPort.send;

              environmentPort.send = function(eventName, data) {
                wiretap(capability, {
                  type: eventName,
                  data: data,
                  direction: 'sent'
                });

                originalSend.apply(environmentPort, arguments);
              };
            });

            if (service) {
              Logger.log("container: Creating service for '" + capability + "'");
              /*jshint newcap:false*/
              // Generic
              service = new service(environmentPort, this);
              service.initialize(environmentPort, capability);
              sandbox.oasis.services.push(service);
              this.capabilities[capability] = service;
            }

            // Law of Demeter violation
            port = sandboxPort;

            this.envPortDefereds[capability].resolve(environmentPort);
          }

          Logger.log("container: Port created for '" + capability + "'");
          this.sandboxPortDefereds[capability].resolve(port);
        }, this);
      },

      destroyChannels: function() {
        for( var prop in this.channels ) {
          this.channels[prop].destroy();
          delete this.channels[prop];
        }
        this.channels = [];
      },

      connectPorts: function () {
        var sandbox = this;

        var allSandboxPortPromises = a_reduce.call(this._capabilitiesToConnect, function (accumulator, capability) {
          return accumulator.concat(sandbox.sandboxPortDefereds[capability].promise);
        }, []);

        RSVP.all(allSandboxPortPromises).then(function (ports) {
          Logger.log("container: All " + ports.length + " ports created.  Transferring them.");
          sandbox.adapter.connectPorts(sandbox, ports);
        }).fail(RSVP.rethrow);
      },

      start: function(options) {
        this.adapter.startSandbox(this, options);
      },

      terminate: function() {
        var sandbox = this,
            channel,
            environmentPort;

        if( this.isTerminated ) { return; }
        this.isTerminated = true;

        this.adapter.terminateSandbox(this);

        this.destroyChannels();

        for( var index=0 ; index<sandbox.oasis.services.length ; index++) {
          sandbox.oasis.services[index].destroy();
          delete sandbox.oasis.services[index];
        }
        sandbox.oasis.services = [];
      },

      onerror: function(error) {
        throw error;
      },

      name: function() {
        return this.adapter.name(this);
      },

      // Oasis internal

      _filterCapabilities: function(capabilities) {
        return uniq.call(this.adapter.filterCapabilities(capabilities));
      },

      _waitForLoadDeferred: function () {
        if (!this._loadDeferred) {
          // the adapter will resolve this
          this._loadDeferred = RSVP.defer();
        }

        return this._loadDeferred;
      }
    };

    __exports__["default"] = OasisSandbox;
  });
define("oasis/sandbox_init", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function autoInitializeSandbox () {
      if (typeof window !== 'undefined') {
        if (/PhantomJS/.test(navigator.userAgent)) {
          // We don't support phantomjs for several reasons, including
          //  - window.constructor vs Window
          //  - postMessage must not have ports (but recall in IE postMessage must
          //    have ports)
          //  - because of the above we need to polyfill, but we fail to do so
          //    because we see MessageChannel in global object
          //  - we erroneously try to decode the oasis load message; alternatively
          //    we should just encode the init message
          //  - all the things we haven't noticed yet
          return;
        }

        if (window.parent && window.parent !== window) {
          Oasis.adapters.iframe.connectSandbox(this);
        } 
      } else {
        Oasis.adapters.webworker.connectSandbox(this);
      }
    }

    __exports__["default"] = autoInitializeSandbox;
  });
define("oasis/service", 
  ["oasis/shims","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var o_create = __dependency1__.o_create;

    /**
      This is a base class that services and consumers can subclass to easily
      implement a number of events and requests at once.

      Example:

          var MetadataService = Oasis.Service.extend({
            initialize: function() {
              this.send('data', this.sandbox.data);
            },

            events: {
              changed: function(data) {
                this.sandbox.data = data;
              }
            },

            requests: {
              valueForProperty: function(name, promise) {
                promise.resolve(this.sandbox.data[name]);
              }
            }
          });

      In the above example, the metadata service implements the Service
      API using `initialize`, `events` and `requests`.

      Both services (implemented in the containing environment) and
      consumers (implemented in the sandbox) use the same API for
      registering events and requests.

      In the containing environment, a service is registered in the
      `createSandbox` method. In the sandbox, a consumer is registered
      using `Oasis.connect`.

      ### `initialize`

      Oasis calls the `initialize` method once the other side of the
      connection has initialized the connection.

      This method is useful to pass initial data back to the other side
      of the connection. You can also set up events or requests manually,
      but you will usually want to use the `events` and `requests` sections
      for events and requests.

      ### `events`

      The `events` object is a list of event names and associated callbacks.
      Oasis will automatically set up listeners for each named event, and
      trigger the callback with the data provided by the other side of the
      connection.

      ### `requests`

      The `requests` object is a list of request names and associated
      callbacks. Oasis will automatically set up listeners for requests
      made by the other side of the connection, and trigger the callback
      with the request information as well as a promise that you should
      use to fulfill the request.

      Once you have the information requested, you should call
      `promise.resolve` with the response data.

      @constructor
      @param {OasisPort} port
      @param {OasisSandbox} sandbox in the containing environment, the
        OasisSandbox that this service is connected to.
    */
    function Service (port, sandbox) {
      var service = this, prop, callback;

      this.sandbox = sandbox;
      this.port = port;

      function xform(callback) {
        return function() {
          return callback.apply(service, arguments);
        };
      }

      for (prop in this.events) {
        callback = this.events[prop];
        port.on(prop, xform(callback));
      }

      for (prop in this.requests) {
        callback = this.requests[prop];
        port.onRequest(prop, xform(callback));
      }
    }

    Service.prototype = {
      /**
        This hook is called when the connection is established. When
        `initialize` is called, it is safe to register listeners and
        send data to the other side.

        The implementation of Oasis makes it impossible for messages
        to get dropped on the floor due to timing issues.

        @param {OasisPort} port the port to the other side of the connection
        @param {String} name the name of the service
      */
      initialize: function() {},


      /**
        This hooks is called when an attempt is made to connect to a capability the
        environment does not provide.
      */
      error: function() {},

      /**
        This hook is called when the connection is stopped. When
        `destroy` is called, it is safe to unregister listeners.
      */
      destroy: function() {},

      /**
        This method can be used to send events to the other side of the
        connection.

        @param {String} eventName the name of the event to send to the
          other side of the connection
        @param {Structured} data an additional piece of data to include
          as the data for the event.
      */
      send: function() {
        return this.port.send.apply(this.port, arguments);
      },

      /**
        This method can be used to request data from the other side of
        the connection.

        @param {String} requestName the name of the request to send to
          the other side of the connection.
        @return {Promise} a promise that will be resolved by the other
          side of the connection. Use `.then` to wait for the resolution.
      */
      request: function() {
        return this.port.request.apply(this.port, arguments);
      }
    };

    Service.extend = function extend(object) {
      var superConstructor = this;

      function Service() {
        if (Service.prototype.init) { Service.prototype.init.call(this); }
        superConstructor.apply(this, arguments);
      }

      Service.extend = extend;

      var ServiceProto = Service.prototype = o_create(this.prototype);

      for (var prop in object) {
        ServiceProto[prop] = object[prop];
      }

      return Service;
    };

    __exports__["default"] = Service;
  });
define("oasis/shims", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var K = function() {};

    function o_create(obj, props) {
      K.prototype = obj;
      obj = new K();
      if (props) {
        K.prototype = obj;
        for (var prop in props) {
          K.prototype[prop] = props[prop].value;
        }
        obj = new K();
      }
      K.prototype = null;

      return obj;
    }

    __exports__.o_create = o_create;// If it turns out we need a better polyfill we can grab mozilla's at: 
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.removeEventListener?redirectlocale=en-US&redirectslug=DOM%2FEventTarget.removeEventListener#Polyfill_to_support_older_browsers
    function addEventListener(receiver, eventName, fn) {
      if (receiver.addEventListener) {
        return receiver.addEventListener(eventName, fn);
      } else if (receiver.attachEvent) {
        return receiver.attachEvent('on' + eventName, fn);
      }
    }

    __exports__.addEventListener = addEventListener;function removeEventListener(receiver, eventName, fn) {
      if (receiver.removeEventListener) {
        return receiver.removeEventListener(eventName, fn);
      } else if (receiver.detachEvent) {
        return receiver.detachEvent('on' + eventName, fn);
      }
    }

    __exports__.removeEventListener = removeEventListener;function isNativeFunc(func) {
      // This should probably work in all browsers likely to have ES5 array methods
      return func && Function.prototype.toString.call(func).indexOf('[native code]') > -1;
    }

    var a_forEach = isNativeFunc(Array.prototype.forEach) ? Array.prototype.forEach : function(fun /*, thisp */) {
      if (this === void 0 || this === null) {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun !== "function") {
        throw new TypeError();
      }

      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          fun.call(thisp, t[i], i, t);
        }
      }
    };
    __exports__.a_forEach = a_forEach;
    var a_reduce = isNativeFunc(Array.prototype.reduce) ? Array.prototype.reduce : function(callback, opt_initialValue){
      if (null === this || 'undefined' === typeof this) {
        // At the moment all modern browsers, that support strict mode, have
        // native implementation of Array.prototype.reduce. For instance, IE8
        // does not support strict mode, so this check is actually useless.
        throw new TypeError(
            'Array.prototype.reduce called on null or undefined');
      }
      if ('function' !== typeof callback) {
        throw new TypeError(callback + ' is not a function');
      }
      var index = 0, length = this.length >>> 0, value, isValueSet = false;
      if (1 < arguments.length) {
        value = opt_initialValue;
        isValueSet = true;
      }
      for ( ; length > index; ++index) {
        if (!this.hasOwnProperty(index)) continue;
        if (isValueSet) {
          value = callback(value, this[index], index, this);
        } else {
          value = this[index];
          isValueSet = true;
        }
      }
      if (!isValueSet) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      return value;
    };
    __exports__.a_reduce = a_reduce;
    var a_map = isNativeFunc(Array.prototype.map) ? Array.prototype.map : function(callback, thisArg) {

        var T, A, k;

        if (this == null) {
          throw new TypeError(" this is null or not defined");
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
          throw new TypeError(callback + " is not a function");
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (thisArg) {
          T = thisArg;
        }

        // 6. Let A be a new array created as if by the expression new Array(len) where Array is
        // the standard built-in constructor with that name and len is the value of len.
        A = new Array(len);

        // 7. Let k be 0
        k = 0;

        // 8. Repeat, while k < len
        while(k < len) {

          var kValue, mappedValue;

          // a. Let Pk be ToString(k).
          //   This is implicit for LHS operands of the in operator
          // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
          //   This step can be combined with c
          // c. If kPresent is true, then
          if (k in O) {

            // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
            kValue = O[ k ];

            // ii. Let mappedValue be the result of calling the Call internal method of callback
            // with T as the this value and argument list containing kValue, k, and O.
            mappedValue = callback.call(T, kValue, k, O);

            // iii. Call the DefineOwnProperty internal method of A with arguments
            // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
            // and false.

            // In browsers that support Object.defineProperty, use the following:
            // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

            // For best browser support, use the following:
            A[ k ] = mappedValue;
          }
          // d. Increase k by 1.
          k++;
        }

        // 9. return A
        return A;
      };
    __exports__.a_map = a_map; 

    var a_indexOf = isNativeFunc(Array.prototype.indexOf) ? Array.prototype.indexOf : function (searchElement /*, fromIndex */ ) {
      /* jshint eqeqeq:false */
      "use strict";
      if (this == null) {
        throw new TypeError();
      }
      var t = Object(this);
      var len = t.length >>> 0;

      if (len === 0) {
        return -1;
      }
      var n = 0;
      if (arguments.length > 1) {
        n = Number(arguments[1]);
        if (n != n) { // shortcut for verifying if it's NaN
          n = 0;
        } else if (n != 0 && n != Infinity && n != -Infinity) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if (n >= len) {
        return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    };
    __exports__.a_indexOf = a_indexOf;
    var a_filter = isNativeFunc(Array.prototype.filter) ? Array.prototype.filter : function(fun /*, thisp*/) {
      'use strict';

      if (!this) {
        throw new TypeError();
      }

      var objects = Object(this);
      var len = objects.length >>> 0;
      if (typeof fun !== 'function') {
        throw new TypeError();
      }

      var res = [];
      var thisp = arguments[1];
      for (var i in objects) {
        if (objects.hasOwnProperty(i)) {
          if (fun.call(thisp, objects[i], i, objects)) {
            res.push(objects[i]);
          }
        }
      }

      return res;
    };
    __exports__.a_filter = a_filter;
  });
define("oasis/util", 
  ["oasis/shims","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var o_create = __dependency1__.o_create;
    var a_filter = __dependency1__.a_filter;

    function assert(assertion, string) {
      if (!assertion) {
        throw new Error(string);
      }
    }

    __exports__.assert = assert;function noop() { }

    __exports__.noop = noop;function mustImplement(className, name) {
      return function() {
        throw new Error("Subclasses of " + className + " must implement " + name);
      };
    }

    __exports__.mustImplement = mustImplement;function extend(parent, object) {
      function OasisObject() {
        parent.apply(this, arguments);
        if (this.initialize) {
          this.initialize.apply(this, arguments);
        }
      }

      OasisObject.prototype = o_create(parent.prototype);

      for (var prop in object) {
        if (!object.hasOwnProperty(prop)) { continue; }
        OasisObject.prototype[prop] = object[prop];
      }

      return OasisObject;
    }

    __exports__.extend = extend;function delegate(delegateeProperty, delegatedMethod) {
      return function () {
        var delegatee = this[delegateeProperty];
        return delegatee[delegatedMethod].apply(delegatee, arguments);
      };
    }

    __exports__.delegate = delegate;function uniq() {
      var seen = {};
      return a_filter.call(this, function (item) {
        var _seen = !seen.hasOwnProperty(item);
        seen[item] = true;
        return _seen;
      });
    }

    __exports__.uniq = uniq;function reverseMerge(a, b) {
      for (var prop in b) {
        if (!b.hasOwnProperty(prop)) { continue; }

        if (! (prop in a)) {
          a[prop] = b[prop];
        }
      }

      return a;
    }

    __exports__.reverseMerge = reverseMerge;
  });
define("oasis/version", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = '0.4.0';
  });
define("oasis/webworker_adapter", 
  ["rsvp","oasis/logger","oasis/util","oasis/shims","oasis/base_adapter","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    /*global self, postMessage, importScripts, UUID */

    var RSVP = __dependency1__;
    var Logger = __dependency2__["default"];
    var assert = __dependency3__.assert;
    var extend = __dependency3__.extend;
    var a_forEach = __dependency4__.a_forEach;
    var addEventListener = __dependency4__.addEventListener;
    var removeEventListener = __dependency4__.removeEventListener;

    var BaseAdapter = __dependency5__["default"];

    var WebworkerAdapter = extend(BaseAdapter, {
      type: 'js',

      //-------------------------------------------------------------------------
      // Environment API

      initializeSandbox: function(sandbox) {
        var worker = new Worker(sandbox.options.url);
        worker.name = sandbox.options.url + '?uuid=' + UUID.generate();
        sandbox.worker = worker;

        // Error handling inside the worker
        worker.errorHandler = function(event) {
          if(!event.data.sandboxException) {return;}

          sandbox.onerror( event.data.sandboxException );
        };
        addEventListener(worker, 'message', worker.errorHandler);

        sandbox._waitForLoadDeferred().resolve(new RSVP.Promise( function(resolve, reject) {
          worker.initializationHandler = function (event) {
            sandbox.oasis.configuration.eventCallback(function () {
              if( event.data !== sandbox.adapter.sandboxInitializedMessage ) {return;}
              removeEventListener(worker, 'message', worker.initializationHandler);

              Logger.log("worker sandbox initialized");
              resolve(sandbox);
            });
          };
          addEventListener(worker, 'message', worker.initializationHandler);
        }));

        worker.loadHandler = function (event) {
          sandbox.oasis.configuration.eventCallback(function () {
            if( event.data !== sandbox.adapter.oasisLoadedMessage ) {return;}
            removeEventListener(worker, 'message', worker.loadHandler);

            Logger.log("worker sandbox initialized");
            sandbox.createAndTransferCapabilities();
          });
        };
        addEventListener(worker, 'message', worker.loadHandler);
      },

      startSandbox: function(sandbox) { },

      terminateSandbox: function(sandbox) {
        var worker = sandbox.worker;

        removeEventListener(worker, 'message', worker.loadHandler);
        removeEventListener(worker, 'message', worker.initializationHandler);
        sandbox.worker.terminate();
      },

      connectPorts: function(sandbox, ports) {
        var rawPorts = ports.map(function(port) { return port.port; }),
            message = this.createInitializationMessage(sandbox);

        Worker.postMessage(sandbox.worker, message, rawPorts);
      },

      connectSandbox: function(oasis) {
        return BaseAdapter.prototype.connectSandbox.call(this, self, oasis);
      },

      //-------------------------------------------------------------------------
      // Sandbox API

      name: function(sandbox) {
        return sandbox.worker.name;
      },

      oasisLoaded: function() {
        postMessage(this.oasisLoadedMessage, []);
      },

      didConnect: function() {
        postMessage(this.sandboxInitializedMessage, []);
      }
    });

    __exports__["default"] = WebworkerAdapter;
  });
define("oasis/xhr", 
  ["rsvp","oasis/util","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*global XDomainRequest */

    var RSVP = __dependency1__;
    var noop = __dependency2__.noop;

    var a_slice = Array.prototype.slice;

    function acceptsHeader(options) {
      var dataType = options.dataType;

      if (dataType && accepts[dataType]) {
        return accepts[dataType];
      }

      return accepts['*'];
    }

    function xhrSetRequestHeader(xhr, options) {
      xhr.setRequestHeader("Accepts", acceptsHeader(options));
    }

    function xhrGetLoadStatus(xhr) {
      return xhr.status;
    }

    function xdrGetLoadStatus() {
      return 200;
    }

    var NONE = {};

    function trigger(event, oasis) {
      if (!oasis) { return; }

      var args = a_slice.call(arguments, 2);

      args.unshift(event);
      oasis.trigger.apply(oasis, args);
    }

    var accepts = {
      "*": "*/*",
      text: "text/plain",
      html: "text/html",
      xml: "application/xml, text/xml",
      json: "application/json, text/javascript"
    };

    var XHR, setRequestHeader, getLoadStatus, send;

    try {
      if ('withCredentials' in new XMLHttpRequest()) {
        XHR = XMLHttpRequest;
        setRequestHeader = xhrSetRequestHeader;
        getLoadStatus = xhrGetLoadStatus;
      } else if (typeof XDomainRequest !== 'undefined') {
        XHR = XDomainRequest;
        setRequestHeader = noop;
        getLoadStatus = xdrGetLoadStatus;
      }
    } catch( exception ) {
      if (typeof XDomainRequest !== 'undefined') {
        XHR = XDomainRequest;
        setRequestHeader = noop;
        getLoadStatus = xdrGetLoadStatus;
      }
    }
    // else inline adapter with cross-domain cards is not going to work


    function xhr(url, options, oasis) {
      if (!oasis && this instanceof Oasis) { oasis = this; }
      if (!options) { options = NONE; }

      return new RSVP.Promise(function(resolve, reject){
        var xhr = new XHR();
        xhr.open("get", url, true);
        setRequestHeader(xhr, options);

        if (options.timeout) {
          xhr.timeout = options.timeout;
        }

        xhr.onload = function () {
          trigger('xhr.load', oasis, url, options, xhr);

          var status = getLoadStatus(xhr);
          if (status >= 200 && status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(xhr);
          }
        };

        xhr.onprogress = noop;
        xhr.ontimeout = function () {
          trigger('xhr.timeout', oasis, url, options, xhr);
          reject(xhr);
        };

        xhr.onerror = function () {
          trigger('xhr.error', oasis, url, options, xhr);
          reject(xhr);
        };

        trigger('xhr.send', oasis, url, options, xhr);
        xhr.send();
      });
    }

    __exports__.xhr = xhr;
  });
define('rsvp/-internal', [
    './utils',
    './instrument',
    './config',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __exports__) {
    'use strict';
    var objectOrFunction = __dependency1__.objectOrFunction;
    var isFunction = __dependency1__.isFunction;
    var now = __dependency1__.now;
    var instrument = __dependency2__['default'];
    var config = __dependency3__.config;
    function noop() {
    }
    var PENDING = void 0;
    var FULFILLED = 1;
    var REJECTED = 2;
    var GET_THEN_ERROR = new ErrorObject();
    function getThen(promise) {
        try {
            return promise.then;
        } catch (error) {
            GET_THEN_ERROR.error = error;
            return GET_THEN_ERROR;
        }
    }
    function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
        try {
            then.call(value, fulfillmentHandler, rejectionHandler);
        } catch (e) {
            return e;
        }
    }
    function handleForeignThenable(promise, thenable, then) {
        config.async(function (promise$2) {
            var sealed = false;
            var error = tryThen(then, thenable, function (value) {
                    if (sealed) {
                        return;
                    }
                    sealed = true;
                    if (thenable !== value) {
                        resolve(promise$2, value);
                    } else {
                        fulfill(promise$2, value);
                    }
                }, function (reason) {
                    if (sealed) {
                        return;
                    }
                    sealed = true;
                    reject(promise$2, reason);
                }, 'Settle: ' + (promise$2._label || ' unknown promise'));
            if (!sealed && error) {
                sealed = true;
                reject(promise$2, error);
            }
        }, promise);
    }
    function handleOwnThenable(promise, thenable) {
        promise._onerror = null;
        if (thenable._state === FULFILLED) {
            fulfill(promise, thenable._result);
        } else if (promise._state === REJECTED) {
            reject(promise, thenable._result);
        } else {
            subscribe(thenable, undefined, function (value) {
                if (thenable !== value) {
                    resolve(promise, value);
                } else {
                    fulfill(promise, value);
                }
            }, function (reason) {
                reject(promise, reason);
            });
        }
    }
    function handleMaybeThenable(promise, maybeThenable) {
        if (maybeThenable instanceof promise.constructor) {
            handleOwnThenable(promise, maybeThenable);
        } else {
            var then = getThen(maybeThenable);
            if (then === GET_THEN_ERROR) {
                reject(promise, GET_THEN_ERROR.error);
            } else if (then === undefined) {
                fulfill(promise, maybeThenable);
            } else if (isFunction(then)) {
                handleForeignThenable(promise, maybeThenable, then);
            } else {
                fulfill(promise, maybeThenable);
            }
        }
    }
    function resolve(promise, value) {
        if (promise === value) {
            fulfill(promise, value);
        } else if (objectOrFunction(value)) {
            handleMaybeThenable(promise, value);
        } else {
            fulfill(promise, value);
        }
    }
    function publishRejection(promise) {
        if (promise._onerror) {
            promise._onerror(promise._result);
        }
        publish(promise);
    }
    function fulfill(promise, value) {
        if (promise._state !== PENDING) {
            return;
        }
        promise._result = value;
        promise._state = FULFILLED;
        if (promise._subscribers.length === 0) {
            if (config.instrument) {
                instrument('fulfilled', promise);
            }
        } else {
            config.async(publish, promise);
        }
    }
    function reject(promise, reason) {
        if (promise._state !== PENDING) {
            return;
        }
        promise._state = REJECTED;
        promise._result = reason;
        config.async(publishRejection, promise);
    }
    function subscribe(parent, child, onFulfillment, onRejection) {
        var subscribers = parent._subscribers;
        var length = subscribers.length;
        parent._onerror = null;
        subscribers[length] = child;
        subscribers[length + FULFILLED] = onFulfillment;
        subscribers[length + REJECTED] = onRejection;
        if (length === 0 && parent._state) {
            config.async(publish, parent);
        }
    }
    function publish(promise) {
        var subscribers = promise._subscribers;
        var settled = promise._state;
        if (config.instrument) {
            instrument(settled === FULFILLED ? 'fulfilled' : 'rejected', promise);
        }
        if (subscribers.length === 0) {
            return;
        }
        var child, callback, detail = promise._result;
        for (var i = 0; i < subscribers.length; i += 3) {
            child = subscribers[i];
            callback = subscribers[i + settled];
            if (child) {
                invokeCallback(settled, child, callback, detail);
            } else {
                callback(detail);
            }
        }
        promise._subscribers.length = 0;
    }
    function ErrorObject() {
        this.error = null;
    }
    var TRY_CATCH_ERROR = new ErrorObject();
    function tryCatch(callback, detail) {
        try {
            return callback(detail);
        } catch (e) {
            TRY_CATCH_ERROR.error = e;
            return TRY_CATCH_ERROR;
        }
    }
    function invokeCallback(settled, promise, callback, detail) {
        var hasCallback = isFunction(callback), value, error, succeeded, failed;
        if (hasCallback) {
            value = tryCatch(callback, detail);
            if (value === TRY_CATCH_ERROR) {
                failed = true;
                error = value.error;
                value = null;
            } else {
                succeeded = true;
            }
            if (promise === value) {
                reject(promise, new TypeError('A promises callback cannot return that same promise.'));
                return;
            }
        } else {
            value = detail;
            succeeded = true;
        }
        if (promise._state !== PENDING) {
        }    // noop
        else if (hasCallback && succeeded) {
            resolve(promise, value);
        } else if (failed) {
            reject(promise, error);
        } else if (settled === FULFILLED) {
            fulfill(promise, value);
        } else if (settled === REJECTED) {
            reject(promise, value);
        }
    }
    function initializePromise(promise, resolver) {
        try {
            resolver(function resolvePromise(value) {
                resolve(promise, value);
            }, function rejectPromise(reason) {
                reject(promise, reason);
            });
        } catch (e) {
            reject(promise, e);
        }
    }
    __exports__.noop = noop;
    __exports__.resolve = resolve;
    __exports__.reject = reject;
    __exports__.fulfill = fulfill;
    __exports__.subscribe = subscribe;
    __exports__.publish = publish;
    __exports__.publishRejection = publishRejection;
    __exports__.initializePromise = initializePromise;
    __exports__.invokeCallback = invokeCallback;
    __exports__.FULFILLED = FULFILLED;
    __exports__.REJECTED = REJECTED;
});
define('rsvp/all-settled', [
    './enumerator',
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __exports__) {
    'use strict';
    var Enumerator = __dependency1__['default'];
    var makeSettledResult = __dependency1__.makeSettledResult;
    var Promise = __dependency2__['default'];
    var o_create = __dependency3__.o_create;
    function AllSettled(Constructor, entries, label) {
        this._superConstructor(Constructor, entries, false, label);
    }
    AllSettled.prototype = o_create(Enumerator.prototype);
    AllSettled.prototype._superConstructor = Enumerator;
    AllSettled.prototype._makeResult = makeSettledResult;
    AllSettled.prototype._validationError = function () {
        return new Error('allSettled must be called with an array');
    };
    /**
      `RSVP.allSettled` is similar to `RSVP.all`, but instead of implementing
      a fail-fast method, it waits until all the promises have returned and
      shows you all the results. This is useful if you want to handle multiple
      promises' failure states together as a set.

      Returns a promise that is fulfilled when all the given promises have been
      settled. The return promise is fulfilled with an array of the states of
      the promises passed into the `promises` array argument.

      Each state object will either indicate fulfillment or rejection, and
      provide the corresponding value or reason. The states will take one of
      the following formats:

      ```javascript
      { state: 'fulfilled', value: value }
        or
      { state: 'rejected', reason: reason }
      ```

      Example:

      ```javascript
      var promise1 = RSVP.Promise.resolve(1);
      var promise2 = RSVP.Promise.reject(new Error('2'));
      var promise3 = RSVP.Promise.reject(new Error('3'));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.allSettled(promises).then(function(array){
        // array == [
        //   { state: 'fulfilled', value: 1 },
        //   { state: 'rejected', reason: Error },
        //   { state: 'rejected', reason: Error }
        // ]
        // Note that for the second item, reason.message will be "2", and for the
        // third item, reason.message will be "3".
      }, function(error) {
        // Not run. (This block would only be called if allSettled had failed,
        // for instance if passed an incorrect argument type.)
      });
      ```

      @method allSettled
      @static
      @for RSVP
      @param {Array} promises
      @param {String} label - optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled with an array of the settled
      states of the constituent promises.
    */
    __exports__['default'] = function allSettled(entries, label) {
        return new AllSettled(Promise, entries, label).promise;
    };
});
define('rsvp/all', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.all`.

      @method all
      @static
      @for RSVP
      @param {Array} array Array of promises.
      @param {String} label An optional label. This is useful
      for tooling.
    */
    __exports__['default'] = function all(array, label) {
        return Promise.all(array, label);
    };
});
define('rsvp/asap', ['exports'], function (__exports__) {
    'use strict';
    var length = 0;
    __exports__['default'] = function asap(callback, arg) {
        queue[length] = callback;
        queue[length + 1] = arg;
        length += 2;
        if (length === 2) {
            // If length is 1, that means that we need to schedule an async flush.
            // If additional callbacks are queued before the queue is flushed, they
            // will be processed by this flush that we are scheduling.
            scheduleFlush();
        }
    };
    var browserGlobal = typeof window !== 'undefined' ? window : {};
    var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
    // test for web worker but not in IE10
    var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
    // node
    function useNextTick() {
        return function () {
            process.nextTick(flush);
        };
    }
    function useMutationObserver() {
        var iterations = 0;
        var observer = new BrowserMutationObserver(flush);
        var node = document.createTextNode('');
        observer.observe(node, { characterData: true });
        return function () {
            node.data = iterations = ++iterations % 2;
        };
    }
    // web worker
    function useMessageChannel() {
        var channel = new MessageChannel();
        channel.port1.onmessage = flush;
        return function () {
            channel.port2.postMessage(0);
        };
    }
    function useSetTimeout() {
        return function () {
            setTimeout(flush, 1);
        };
    }
    var queue = new Array(1000);
    function flush() {
        for (var i = 0; i < length; i += 2) {
            var callback = queue[i];
            var arg = queue[i + 1];
            callback(arg);
            queue[i] = undefined;
            queue[i + 1] = undefined;
        }
        length = 0;
    }
    var scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
        scheduleFlush = useNextTick();
    } else if (BrowserMutationObserver) {
        scheduleFlush = useMutationObserver();
    } else if (isWorker) {
        scheduleFlush = useMessageChannel();
    } else {
        scheduleFlush = useSetTimeout();
    }
});
define('rsvp/config', [
    './events',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var EventTarget = __dependency1__['default'];
    var config = { instrument: false };
    EventTarget.mixin(config);
    function configure(name, value) {
        if (name === 'onerror') {
            // handle for legacy users that expect the actual
            // error to be passed to their function added via
            // `RSVP.configure('onerror', someFunctionHere);`
            config.on('error', value);
            return;
        }
        if (arguments.length === 2) {
            config[name] = value;
        } else {
            return config[name];
        }
    }
    __exports__.config = config;
    __exports__.configure = configure;
});
define('rsvp/defer', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    /**
      `RSVP.defer` returns an object similar to jQuery's `$.Deferred`.
      `RSVP.defer` should be used when porting over code reliant on `$.Deferred`'s
      interface. New code should use the `RSVP.Promise` constructor instead.

      The object returned from `RSVP.defer` is a plain object with three properties:

      * promise - an `RSVP.Promise`.
      * reject - a function that causes the `promise` property on this object to
        become rejected
      * resolve - a function that causes the `promise` property on this object to
        become fulfilled.

      Example:

       ```javascript
       var deferred = RSVP.defer();

       deferred.resolve("Success!");

       defered.promise.then(function(value){
         // value here is "Success!"
       });
       ```

      @method defer
      @static
      @for RSVP
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Object}
     */
    __exports__['default'] = function defer(label) {
        var deferred = {};
        deferred.promise = new Promise(function (resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        }, label);
        return deferred;
    };
});
define('rsvp/enumerator', [
    './utils',
    './-internal',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    'use strict';
    var isArray = __dependency1__.isArray;
    var isMaybeThenable = __dependency1__.isMaybeThenable;
    var noop = __dependency2__.noop;
    var reject = __dependency2__.reject;
    var fulfill = __dependency2__.fulfill;
    var subscribe = __dependency2__.subscribe;
    var FULFILLED = __dependency2__.FULFILLED;
    var REJECTED = __dependency2__.REJECTED;
    var PENDING = __dependency2__.PENDING;
    var ABORT_ON_REJECTION = true;
    __exports__.ABORT_ON_REJECTION = ABORT_ON_REJECTION;
    function makeSettledResult(state, position, value) {
        if (state === FULFILLED) {
            return {
                state: 'fulfilled',
                value: value
            };
        } else {
            return {
                state: 'rejected',
                reason: value
            };
        }
    }
    __exports__.makeSettledResult = makeSettledResult;
    function Enumerator(Constructor, input, abortOnReject, label) {
        this._instanceConstructor = Constructor;
        this.promise = new Constructor(noop, label);
        this._abortOnReject = abortOnReject;
        if (this._validateInput(input)) {
            this._input = input;
            this.length = input.length;
            this._remaining = input.length;
            this._init();
            if (this.length === 0) {
                fulfill(this.promise, this._result);
            } else {
                this.length = this.length || 0;
                this._enumerate();
                if (this._remaining === 0) {
                    fulfill(this.promise, this._result);
                }
            }
        } else {
            reject(this.promise, this._validationError());
        }
    }
    Enumerator.prototype._validateInput = function (input) {
        return isArray(input);
    };
    Enumerator.prototype._validationError = function () {
        return new Error('Array Methods must be provided an Array');
    };
    Enumerator.prototype._init = function () {
        this._result = new Array(this.length);
    };
    __exports__['default'] = Enumerator;
    Enumerator.prototype._enumerate = function () {
        var length = this.length;
        var promise = this.promise;
        var input = this._input;
        for (var i = 0; promise._state === PENDING && i < length; i++) {
            this._eachEntry(input[i], i);
        }
    };
    Enumerator.prototype._eachEntry = function (entry, i) {
        var c = this._instanceConstructor;
        if (isMaybeThenable(entry)) {
            if (entry.constructor === c && entry._state !== PENDING) {
                entry._onerror = null;
                this._settledAt(entry._state, i, entry._result);
            } else {
                this._willSettleAt(c.resolve(entry), i);
            }
        } else {
            this._remaining--;
            this._result[i] = this._makeResult(FULFILLED, i, entry);
        }
    };
    Enumerator.prototype._settledAt = function (state, i, value) {
        var promise = this.promise;
        if (promise._state === PENDING) {
            this._remaining--;
            if (this._abortOnReject && state === REJECTED) {
                reject(promise, value);
            } else {
                this._result[i] = this._makeResult(state, i, value);
            }
        }
        if (this._remaining === 0) {
            fulfill(promise, this._result);
        }
    };
    Enumerator.prototype._makeResult = function (state, i, value) {
        return value;
    };
    Enumerator.prototype._willSettleAt = function (promise, i) {
        var enumerator = this;
        subscribe(promise, undefined, function (value) {
            enumerator._settledAt(FULFILLED, i, value);
        }, function (reason) {
            enumerator._settledAt(REJECTED, i, reason);
        });
    };
});
define('rsvp/events', ['exports'], function (__exports__) {
    'use strict';
    function indexOf(callbacks, callback) {
        for (var i = 0, l = callbacks.length; i < l; i++) {
            if (callbacks[i] === callback) {
                return i;
            }
        }
        return -1;
    }
    function callbacksFor(object) {
        var callbacks = object._promiseCallbacks;
        if (!callbacks) {
            callbacks = object._promiseCallbacks = {};
        }
        return callbacks;
    }
    /**
      @class RSVP.EventTarget
    */
    __exports__['default'] = {
        mixin: function (object) {
            object.on = this.on;
            object.off = this.off;
            object.trigger = this.trigger;
            object._promiseCallbacks = undefined;
            return object;
        },
        on: function (eventName, callback) {
            var allCallbacks = callbacksFor(this), callbacks;
            callbacks = allCallbacks[eventName];
            if (!callbacks) {
                callbacks = allCallbacks[eventName] = [];
            }
            if (indexOf(callbacks, callback) === -1) {
                callbacks.push(callback);
            }
        },
        off: function (eventName, callback) {
            var allCallbacks = callbacksFor(this), callbacks, index;
            if (!callback) {
                allCallbacks[eventName] = [];
                return;
            }
            callbacks = allCallbacks[eventName];
            index = indexOf(callbacks, callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        },
        trigger: function (eventName, options) {
            var allCallbacks = callbacksFor(this), callbacks, callbackTuple, callback, binding;
            if (callbacks = allCallbacks[eventName]) {
                // Don't cache the callbacks.length since it may grow
                for (var i = 0; i < callbacks.length; i++) {
                    callback = callbacks[i];
                    callback(options);
                }
            }
        }
    };
});
define('rsvp/filter', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    var isFunction = __dependency2__.isFunction;
    var isMaybeThenable = __dependency2__.isMaybeThenable;
    /**
     `RSVP.filter` is similar to JavaScript's native `filter` method, except that it
      waits for all promises to become fulfilled before running the `filterFn` on
      each item in given to `promises`. `RSVP.filter` returns a promise that will
      become fulfilled with the result of running `filterFn` on the values the
      promises become fulfilled with.

      For example:

      ```javascript

      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);

      var promises = [promise1, promise2, promise3];

      var filterFn = function(item){
        return item > 1;
      };

      RSVP.filter(promises, filterFn).then(function(result){
        // result is [ 2, 3 ]
      });
      ```

      If any of the `promises` given to `RSVP.filter` are rejected, the first promise
      that is rejected will be given as an argument to the returned promise's
      rejection handler. For example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      var filterFn = function(item){
        return item > 1;
      };

      RSVP.filter(promises, filterFn).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "2"
      });
      ```

      `RSVP.filter` will also wait for any promises returned from `filterFn`.
      For instance, you may want to fetch a list of users then return a subset
      of those users based on some asynchronous operation:

      ```javascript

      var alice = { name: 'alice' };
      var bob   = { name: 'bob' };
      var users = [ alice, bob ];

      var promises = users.map(function(user){
        return RSVP.resolve(user);
      });

      var filterFn = function(user){
        // Here, Alice has permissions to create a blog post, but Bob does not.
        return getPrivilegesForUser(user).then(function(privs){
          return privs.can_create_blog_post === true;
        });
      };
      RSVP.filter(promises, filterFn).then(function(users){
        // true, because the server told us only Alice can create a blog post.
        users.length === 1;
        // false, because Alice is the only user present in `users`
        users[0] === bob;
      });
      ```

      @method filter
      @static
      @for RSVP
      @param {Array} promises
      @param {Function} filterFn - function to be called on each resolved value to
      filter the final results.
      @param {String} label optional string describing the promise. Useful for
      tooling.
      @return {Promise}
    */
    __exports__['default'] = function filter(promises, filterFn, label) {
        return Promise.all(promises, label).then(function (values) {
            if (!isFunction(filterFn)) {
                throw new TypeError('You must pass a function as filter\'s second argument.');
            }
            var length = values.length;
            var filtered = new Array(length);
            for (var i = 0; i < length; i++) {
                filtered[i] = filterFn(values[i]);
            }
            return Promise.all(filtered, label).then(function (filtered$2) {
                var results = new Array(length);
                var newLength = 0;
                for (var i$2 = 0; i$2 < length; i$2++) {
                    if (filtered$2[i$2]) {
                        results[newLength] = values[i$2];
                        newLength++;
                    }
                }
                results.length = newLength;
                return results;
            });
        });
    };
});
define('rsvp/hash-settled', [
    './promise',
    './enumerator',
    './promise-hash',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    var makeSettledResult = __dependency2__.makeSettledResult;
    var PromiseHash = __dependency3__['default'];
    var Enumerator = __dependency2__['default'];
    var o_create = __dependency4__.o_create;
    function HashSettled(Constructor, object, label) {
        this._superConstructor(Constructor, object, false, label);
    }
    HashSettled.prototype = o_create(PromiseHash.prototype);
    HashSettled.prototype._superConstructor = Enumerator;
    HashSettled.prototype._makeResult = makeSettledResult;
    HashSettled.prototype._validationError = function () {
        return new Error('hashSettled must be called with an object');
    };
    /**
      `RSVP.hashSettled` is similar to `RSVP.allSettled`, but takes an object
      instead of an array for its `promises` argument.

      Unlike `RSVP.all` or `RSVP.hash`, which implement a fail-fast method,
      but like `RSVP.allSettled`, `hashSettled` waits until all the
      constituent promises have returned and then shows you all the results
      with their states and values/reasons. This is useful if you want to
      handle multiple promises' failure states together as a set.

      Returns a promise that is fulfilled when all the given promises have been
      settled, or rejected if the passed parameters are invalid.

      The returned promise is fulfilled with a hash that has the same key names as
      the `promises` object argument. If any of the values in the object are not
      promises, they will be copied over to the fulfilled object and marked with state
      'fulfilled'.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.Promise.resolve(1),
        yourPromise: RSVP.Promise.resolve(2),
        theirPromise: RSVP.Promise.resolve(3),
        notAPromise: 4
      };

      RSVP.hashSettled(promises).then(function(hash){
        // hash here is an object that looks like:
        // {
        //   myPromise: { state: 'fulfilled', value: 1 },
        //   yourPromise: { state: 'fulfilled', value: 2 },
        //   theirPromise: { state: 'fulfilled', value: 3 },
        //   notAPromise: { state: 'fulfilled', value: 4 }
        // }
      });
      ```

      If any of the `promises` given to `RSVP.hash` are rejected, the state will
      be set to 'rejected' and the reason for rejection provided.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.Promise.resolve(1),
        rejectedPromise: RSVP.Promise.reject(new Error('rejection')),
        anotherRejectedPromise: RSVP.Promise.reject(new Error('more rejection')),
      };

      RSVP.hashSettled(promises).then(function(hash){
        // hash here is an object that looks like:
        // {
        //   myPromise:              { state: 'fulfilled', value: 1 },
        //   rejectedPromise:        { state: 'rejected', reason: Error },
        //   anotherRejectedPromise: { state: 'rejected', reason: Error },
        // }
        // Note that for rejectedPromise, reason.message == 'rejection',
        // and for anotherRejectedPromise, reason.message == 'more rejection'.
      });
      ```

      An important note: `RSVP.hashSettled` is intended for plain JavaScript objects that
      are just a set of keys and values. `RSVP.hashSettled` will NOT preserve prototype
      chains.

      Example:

      ```javascript
      function MyConstructor(){
        this.example = RSVP.Promise.resolve('Example');
      }

      MyConstructor.prototype = {
        protoProperty: RSVP.Promise.resolve('Proto Property')
      };

      var myObject = new MyConstructor();

      RSVP.hashSettled(myObject).then(function(hash){
        // protoProperty will not be present, instead you will just have an
        // object that looks like:
        // {
        //   example: { state: 'fulfilled', value: 'Example' }
        // }
        //
        // hash.hasOwnProperty('protoProperty'); // false
        // 'undefined' === typeof hash.protoProperty
      });
      ```

      @method hashSettled
      @for RSVP
      @param {Object} promises
      @param {String} label optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when when all properties of `promises`
      have been settled.
      @static
    */
    __exports__['default'] = function hashSettled(object, label) {
        return new HashSettled(Promise, object, label).promise;
    };
});
define('rsvp/hash', [
    './promise',
    './promise-hash',
    './enumerator',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    var PromiseHash = __dependency2__['default'];
    var ABORT_ON_REJECTION = __dependency3__.ABORT_ON_REJECTION;
    /**
      `RSVP.hash` is similar to `RSVP.all`, but takes an object instead of an array
      for its `promises` argument.

      Returns a promise that is fulfilled when all the given promises have been
      fulfilled, or rejected if any of them become rejected. The returned promise
      is fulfilled with a hash that has the same key names as the `promises` object
      argument. If any of the values in the object are not promises, they will
      simply be copied over to the fulfilled object.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.resolve(1),
        yourPromise: RSVP.resolve(2),
        theirPromise: RSVP.resolve(3),
        notAPromise: 4
      };

      RSVP.hash(promises).then(function(hash){
        // hash here is an object that looks like:
        // {
        //   myPromise: 1,
        //   yourPromise: 2,
        //   theirPromise: 3,
        //   notAPromise: 4
        // }
      });
      ````

      If any of the `promises` given to `RSVP.hash` are rejected, the first promise
      that is rejected will be given as the reason to the rejection handler.

      Example:

      ```javascript
      var promises = {
        myPromise: RSVP.resolve(1),
        rejectedPromise: RSVP.reject(new Error("rejectedPromise")),
        anotherRejectedPromise: RSVP.reject(new Error("anotherRejectedPromise")),
      };

      RSVP.hash(promises).then(function(hash){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "rejectedPromise"
      });
      ```

      An important note: `RSVP.hash` is intended for plain JavaScript objects that
      are just a set of keys and values. `RSVP.hash` will NOT preserve prototype
      chains.

      Example:

      ```javascript
      function MyConstructor(){
        this.example = RSVP.resolve("Example");
      }

      MyConstructor.prototype = {
        protoProperty: RSVP.resolve("Proto Property")
      };

      var myObject = new MyConstructor();

      RSVP.hash(myObject).then(function(hash){
        // protoProperty will not be present, instead you will just have an
        // object that looks like:
        // {
        //   example: "Example"
        // }
        //
        // hash.hasOwnProperty('protoProperty'); // false
        // 'undefined' === typeof hash.protoProperty
      });
      ```

      @method hash
      @static
      @for RSVP
      @param {Object} promises
      @param {String} label optional string that describes the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when all properties of `promises`
      have been fulfilled, or rejected if any of them become rejected.
    */
    __exports__['default'] = function hash(object, label) {
        return new PromiseHash(Promise, object, label).promise;
    };
});
define('rsvp/instrument', [
    './config',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    'use strict';
    var config = __dependency1__.config;
    var now = __dependency2__.now;
    var queue = [];
    __exports__['default'] = function instrument(eventName, promise, child) {
        if (1 === queue.push({
                name: eventName,
                payload: {
                    guid: promise._guidKey + promise._id,
                    eventName: eventName,
                    detail: promise._result,
                    childGuid: child && promise._guidKey + child._id,
                    label: promise._label,
                    timeStamp: now(),
                    stack: new Error(promise._label).stack
                }
            })) {
            setTimeout(function () {
                var entry;
                for (var i = 0; i < queue.length; i++) {
                    entry = queue[i];
                    config.trigger(entry.name, entry.payload);
                }
                queue.length = 0;
            }, 50);
        }
    };
});
define('rsvp/map', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    var isArray = __dependency2__.isArray;
    var isFunction = __dependency2__.isFunction;
    /**
     `RSVP.map` is similar to JavaScript's native `map` method, except that it
      waits for all promises to become fulfilled before running the `mapFn` on
      each item in given to `promises`. `RSVP.map` returns a promise that will
      become fulfilled with the result of running `mapFn` on the values the promises
      become fulfilled with.

      For example:

      ```javascript

      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      var mapFn = function(item){
        return item + 1;
      };

      RSVP.map(promises, mapFn).then(function(result){
        // result is [ 2, 3, 4 ]
      });
      ```

      If any of the `promises` given to `RSVP.map` are rejected, the first promise
      that is rejected will be given as an argument to the returned promise's
      rejection handler. For example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      var mapFn = function(item){
        return item + 1;
      };

      RSVP.map(promises, mapFn).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(reason) {
        // reason.message === "2"
      });
      ```

      `RSVP.map` will also wait if a promise is returned from `mapFn`. For example,
      say you want to get all comments from a set of blog posts, but you need
      the blog posts first because they contain a url to those comments.

      ```javscript

      var mapFn = function(blogPost){
        // getComments does some ajax and returns an RSVP.Promise that is fulfilled
        // with some comments data
        return getComments(blogPost.comments_url);
      };

      // getBlogPosts does some ajax and returns an RSVP.Promise that is fulfilled
      // with some blog post data
      RSVP.map(getBlogPosts(), mapFn).then(function(comments){
        // comments is the result of asking the server for the comments
        // of all blog posts returned from getBlogPosts()
      });
      ```

      @method map
      @static
      @for RSVP
      @param {Array} promises
      @param {Function} mapFn function to be called on each fulfilled promise.
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled with the result of calling
      `mapFn` on each fulfilled promise or value when they become fulfilled.
       The promise will be rejected if any of the given `promises` become rejected.
      @static
    */
    __exports__['default'] = function map(promises, mapFn, label) {
        return Promise.all(promises, label).then(function (values) {
            if (!isFunction(mapFn)) {
                throw new TypeError('You must pass a function as map\'s second argument.');
            }
            var length = values.length;
            var results = new Array(length);
            for (var i = 0; i < length; i++) {
                results[i] = mapFn(values[i]);
            }
            return Promise.all(results, label);
        });
    };
});
define('rsvp/node', [
    './promise',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    'use strict';
    /* global  arraySlice */
    var Promise = __dependency1__['default'];
    var isArray = __dependency2__.isArray;
    /**
      `RSVP.denodeify` takes a "node-style" function and returns a function that
      will return an `RSVP.Promise`. You can use `denodeify` in Node.js or the
      browser when you'd prefer to use promises over using callbacks. For example,
      `denodeify` transforms the following:

      ```javascript
      var fs = require('fs');

      fs.readFile('myfile.txt', function(err, data){
        if (err) return handleError(err);
        handleData(data);
      });
      ```

      into:

      ```javascript
      var fs = require('fs');
      var readFile = RSVP.denodeify(fs.readFile);

      readFile('myfile.txt').then(handleData, handleError);
      ```

      If the node function has multiple success parameters, then `denodeify`
      just returns the first one:

      ```javascript
      var request = RSVP.denodeify(require('request'));

      request('http://example.com').then(function(res) {
        // ...
      });
      ```

      However, if you need all success parameters, setting `denodeify`'s
      second parameter to `true` causes it to return all success parameters
      as an array:

      ```javascript
      var request = RSVP.denodeify(require('request'), true);

      request('http://example.com').then(function(result) {
        // result[0] -> res
        // result[1] -> body
      });
      ```

      Or if you pass it an array with names it returns the parameters as a hash:

      ```javascript
      var request = RSVP.denodeify(require('request'), ['res', 'body']);

      request('http://example.com').then(function(result) {
        // result.res
        // result.body
      });
      ```

      Sometimes you need to retain the `this`:

      ```javascript
      var app = require('express')();
      var render = RSVP.denodeify(app.render.bind(app));
      ```

      The denodified function inherits from the original function. It works in all
      environments, except IE 10 and below. Consequently all properties of the original
      function are available to you. However, any properties you change on the
      denodeified function won't be changed on the original function. Example:

      ```javascript
      var request = RSVP.denodeify(require('request')),
          cookieJar = request.jar(); // <- Inheritance is used here

      request('http://example.com', {jar: cookieJar}).then(function(res) {
        // cookieJar.cookies holds now the cookies returned by example.com
      });
      ```

      Using `denodeify` makes it easier to compose asynchronous operations instead
      of using callbacks. For example, instead of:

      ```javascript
      var fs = require('fs');

      fs.readFile('myfile.txt', function(err, data){
        if (err) { ... } // Handle error
        fs.writeFile('myfile2.txt', data, function(err){
          if (err) { ... } // Handle error
          console.log('done')
        });
      });
      ```

      you can chain the operations together using `then` from the returned promise:

      ```javascript
      var fs = require('fs');
      var readFile = RSVP.denodeify(fs.readFile);
      var writeFile = RSVP.denodeify(fs.writeFile);

      readFile('myfile.txt').then(function(data){
        return writeFile('myfile2.txt', data);
      }).then(function(){
        console.log('done')
      }).catch(function(error){
        // Handle error
      });
      ```

      @method denodeify
      @static
      @for RSVP
      @param {Function} nodeFunc a "node-style" function that takes a callback as
      its last argument. The callback expects an error to be passed as its first
      argument (if an error occurred, otherwise null), and the value from the
      operation as its second argument ("function(err, value){ }").
      @param {Boolean|Array} argumentNames An optional paramter that if set
      to `true` causes the promise to fulfill with the callback's success arguments
      as an array. This is useful if the node function has multiple success
      paramters. If you set this paramter to an array with names, the promise will
      fulfill with a hash with these names as keys and the success parameters as
      values.
      @return {Function} a function that wraps `nodeFunc` to return an
      `RSVP.Promise`
      @static
    */
    __exports__['default'] = function denodeify(nodeFunc, argumentNames) {
        var asArray = argumentNames === true;
        var asHash = isArray(argumentNames);
        function denodeifiedFunction() {
            var length = arguments.length;
            var nodeArgs = new Array(length);
            for (var i = 0; i < length; i++) {
                nodeArgs[i] = arguments[i];
            }
            var thisArg;
            if (!asArray && !asHash && argumentNames) {
                if (typeof console === 'object') {
                    console.warn('Deprecation: RSVP.denodeify() doesn\'t allow setting the ' + '"this" binding anymore. Use yourFunction.bind(yourThis) instead.');
                }
                thisArg = argumentNames;
            } else {
                thisArg = this;
            }
            return Promise.all(nodeArgs).then(function (nodeArgs$2) {
                return new Promise(resolver);
                // sweet.js has a bug, this resolver can't be defined in the constructor
                // or the arraySlice macro doesn't work
                function resolver(resolve, reject) {
                    function callback() {
                        var length$2 = arguments.length;
                        var args = new Array(length$2);
                        for (var i$2 = 0; i$2 < length$2; i$2++) {
                            args[i$2] = arguments[i$2];
                        }
                        var error = args[0];
                        var value = args[1];
                        if (error) {
                            reject(error);
                        } else if (asArray) {
                            resolve(args.slice(1));
                        } else if (asHash) {
                            var obj = {};
                            var successArguments = args.slice(1);
                            var name;
                            var i$3;
                            for (i$3 = 0; i$3 < argumentNames.length; i$3++) {
                                name = argumentNames[i$3];
                                obj[name] = successArguments[i$3];
                            }
                            resolve(obj);
                        } else {
                            resolve(value);
                        }
                    }
                    nodeArgs$2.push(callback);
                    nodeFunc.apply(thisArg, nodeArgs$2);
                }
            });
        }
        denodeifiedFunction.__proto__ = nodeFunc;
        return denodeifiedFunction;
    };
});
define('rsvp/promise-hash', [
    './enumerator',
    './-internal',
    './utils',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __exports__) {
    'use strict';
    var Enumerator = __dependency1__['default'];
    var PENDING = __dependency2__.PENDING;
    var FULFILLED = __dependency2__.FULFILLED;
    var o_create = __dependency3__.o_create;
    function PromiseHash(Constructor, object, label) {
        this._superConstructor(Constructor, object, true, label);
    }
    __exports__['default'] = PromiseHash;
    PromiseHash.prototype = o_create(Enumerator.prototype);
    PromiseHash.prototype._superConstructor = Enumerator;
    PromiseHash.prototype._init = function () {
        this._result = {};
    };
    PromiseHash.prototype._validateInput = function (input) {
        return input && typeof input === 'object';
    };
    PromiseHash.prototype._validationError = function () {
        return new Error('Promise.hash must be called with an object');
    };
    PromiseHash.prototype._enumerate = function () {
        var promise = this.promise;
        var input = this._input;
        var results = [];
        for (var key in input) {
            if (promise._state === PENDING && input.hasOwnProperty(key)) {
                results.push({
                    position: key,
                    entry: input[key]
                });
            }
        }
        var length = results.length;
        this._remaining = length;
        var result;
        for (var i = 0; promise._state === PENDING && i < length; i++) {
            result = results[i];
            this._eachEntry(result.entry, result.position);
        }
    };
});
define('rsvp/promise', [
    './config',
    './events',
    './instrument',
    './utils',
    './-internal',
    './promise/cast',
    './promise/all',
    './promise/race',
    './promise/resolve',
    './promise/reject',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __exports__) {
    'use strict';
    var config = __dependency1__.config;
    var EventTarget = __dependency2__['default'];
    var instrument = __dependency3__['default'];
    var objectOrFunction = __dependency4__.objectOrFunction;
    var isFunction = __dependency4__.isFunction;
    var now = __dependency4__.now;
    var noop = __dependency5__.noop;
    var resolve = __dependency5__.resolve;
    var reject = __dependency5__.reject;
    var fulfill = __dependency5__.fulfill;
    var subscribe = __dependency5__.subscribe;
    var initializePromise = __dependency5__.initializePromise;
    var invokeCallback = __dependency5__.invokeCallback;
    var FULFILLED = __dependency5__.FULFILLED;
    var cast = __dependency6__['default'];
    var all = __dependency7__['default'];
    var race = __dependency8__['default'];
    var Resolve = __dependency9__['default'];
    var Reject = __dependency10__['default'];
    var guidKey = 'rsvp_' + now() + '-';
    var counter = 0;
    function needsResolver() {
        throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }
    function needsNew() {
        throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');
    }
    __exports__['default'] = Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error("getJSON: `" + url + "` failed with status: [" + this.status + "]"));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class RSVP.Promise
      @param {function} resolver
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @constructor
    */
    function Promise(resolver, label) {
        this._id = counter++;
        this._label = label;
        this._subscribers = [];
        if (config.instrument) {
            instrument('created', this);
        }
        if (noop !== resolver) {
            if (!isFunction(resolver)) {
                needsResolver();
            }
            if (!(this instanceof Promise)) {
                needsNew();
            }
            initializePromise(this, resolver);
        }
    }
    Promise.cast = cast;
    Promise.all = all;
    Promise.race = race;
    Promise.resolve = Resolve;
    Promise.reject = Reject;
    Promise.prototype = {
        constructor: Promise,
        _id: undefined,
        _guidKey: guidKey,
        _label: undefined,
        _state: undefined,
        _result: undefined,
        _subscribers: undefined,
        _onerror: function (reason) {
            config.trigger('error', reason);
        },
        then: function (onFulfillment, onRejection, label) {
            var parent = this;
            parent._onerror = null;
            var child = new this.constructor(noop, label);
            var state = parent._state;
            var result = parent._result;
            if (config.instrument) {
                instrument('chained', parent, child);
            }
            if (state === FULFILLED && onFulfillment) {
                config.async(function () {
                    invokeCallback(state, child, onFulfillment, result);
                });
            } else {
                subscribe(parent, child, onFulfillment, onRejection);
            }
            return child;
        },
        'catch': function (onRejection, label) {
            return this.then(null, onRejection, label);
        },
        'finally': function (callback, label) {
            var constructor = this.constructor;
            return this.then(function (value) {
                return constructor.resolve(callback()).then(function () {
                    return value;
                });
            }, function (reason) {
                return constructor.resolve(callback()).then(function () {
                    throw reason;
                });
            }, label);
        }
    };
});
define('rsvp/promise/all', [
    '../enumerator',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var Enumerator = __dependency1__['default'];
    /**
      `RSVP.Promise.all` accepts an array of promises, and returns a new promise which
      is fulfilled with an array of fulfillment values for the passed promises, or
      rejected with the reason of the first passed promise to be rejected. It casts all
      elements of the passed iterable to promises as it runs this algorithm.

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.resolve(2);
      var promise3 = RSVP.resolve(3);
      var promises = [ promise1, promise2, promise3 ];

      RSVP.Promise.all(promises).then(function(array){
        // The array here would be [ 1, 2, 3 ];
      });
      ```

      If any of the `promises` given to `RSVP.all` are rejected, the first promise
      that is rejected will be given as an argument to the returned promises's
      rejection handler. For example:

      Example:

      ```javascript
      var promise1 = RSVP.resolve(1);
      var promise2 = RSVP.reject(new Error("2"));
      var promise3 = RSVP.reject(new Error("3"));
      var promises = [ promise1, promise2, promise3 ];

      RSVP.Promise.all(promises).then(function(array){
        // Code here never runs because there are rejected promises!
      }, function(error) {
        // error.message === "2"
      });
      ```

      @method all
      @static
      @param {Array} entries array of promises
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise that is fulfilled when all `promises` have been
      fulfilled, or rejected if any of them become rejected.
      @static
    */
    __exports__['default'] = function all(entries, label) {
        return new Enumerator(this, entries, true, label).promise;
    };
});
define('rsvp/promise/cast', [
    './resolve',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var resolve = __dependency1__['default'];
    /**
      @deprecated

      `RSVP.Promise.cast` coerces its argument to a promise, or returns the
      argument if it is already a promise which shares a constructor with the caster.

      Example:

      ```javascript
      var promise = RSVP.Promise.resolve(1);
      var casted = RSVP.Promise.cast(promise);

      console.log(promise === casted); // true
      ```

      In the case of a promise whose constructor does not match, it is assimilated.
      The resulting promise will fulfill or reject based on the outcome of the
      promise being casted.

      Example:

      ```javascript
      var thennable = $.getJSON('/api/foo');
      var casted = RSVP.Promise.cast(thennable);

      console.log(thennable === casted); // false
      console.log(casted instanceof RSVP.Promise) // true

      casted.then(function(data) {
        // data is the value getJSON fulfills with
      });
      ```

      In the case of a non-promise, a promise which will fulfill with that value is
      returned.

      Example:

      ```javascript
      var value = 1; // could be a number, boolean, string, undefined...
      var casted = RSVP.Promise.cast(value);

      console.log(value === casted); // false
      console.log(casted instanceof RSVP.Promise) // true

      casted.then(function(val) {
        val === value // => true
      });
      ```

      `RSVP.Promise.cast` is similar to `RSVP.Promise.resolve`, but `RSVP.Promise.cast` differs in the
      following ways:

      * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
      have something that could either be a promise or a value. RSVP.resolve
      will have the same effect but will create a new promise wrapper if the
      argument is a promise.
      * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
      promises of the exact class specified, so that the resulting object's `then` is
      ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

      @method cast
      @static
      @param {Object} object to be casted
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise} promise
    */
    __exports__['default'] = resolve;
});
define('rsvp/promise/race', [
    '../utils',
    '../-internal',
    'exports'
], function (__dependency1__, __dependency2__, __exports__) {
    'use strict';
    var isArray = __dependency1__.isArray;
    var isFunction = __dependency1__.isFunction;
    var isMaybeThenable = __dependency1__.isMaybeThenable;
    var noop = __dependency2__.noop;
    var resolve = __dependency2__.resolve;
    var reject = __dependency2__.reject;
    var subscribe = __dependency2__.subscribe;
    var PENDING = __dependency2__.PENDING;
    /**
      `RSVP.Promise.race` returns a new promise which is settled in the same way as the
      first passed promise to settle.

      Example:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 2");
        }, 100);
      });

      RSVP.Promise.race([promise1, promise2]).then(function(result){
        // result === "promise 2" because it was resolved before promise1
        // was resolved.
      });
      ```

      `RSVP.Promise.race` is deterministic in that only the state of the first
      settled promise matters. For example, even if other promises given to the
      `promises` array argument are resolved, but the first settled promise has
      become rejected before the other promises became fulfilled, the returned
      promise will become rejected:

      ```javascript
      var promise1 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          resolve("promise 1");
        }, 200);
      });

      var promise2 = new RSVP.Promise(function(resolve, reject){
        setTimeout(function(){
          reject(new Error("promise 2"));
        }, 100);
      });

      RSVP.Promise.race([promise1, promise2]).then(function(result){
        // Code here never runs
      }, function(reason){
        // reason.message === "promise 2" because promise 2 became rejected before
        // promise 1 became fulfilled
      });
      ```

      An example real-world use case is implementing timeouts:

      ```javascript
      RSVP.Promise.race([ajax('foo.json'), timeout(5000)])
      ```

      @method race
      @static
      @param {Array} promises array of promises to observe
      @param {String} label optional string for describing the promise returned.
      Useful for tooling.
      @return {Promise} a promise which settles in the same way as the first passed
      promise to settle.
    */
    __exports__['default'] = function race(entries, label) {
        /*jshint validthis:true */
        var Constructor = this, entry;
        var promise = new Constructor(noop, label);
        if (!isArray(entries)) {
            reject(promise, new TypeError('You must pass an array to race.'));
            return promise;
        }
        var length = entries.length;
        function onFulfillment(value) {
            resolve(promise, value);
        }
        function onRejection(reason) {
            reject(promise, reason);
        }
        for (var i = 0; promise._state === PENDING && i < length; i++) {
            subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
        }
        return promise;
    };
});
define('rsvp/promise/reject', [
    '../-internal',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var noop = __dependency1__.noop;
    var _reject = __dependency1__.reject;
    /**
      `RSVP.Promise.reject` returns a promise rejected with the passed `reason`.
      It is shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        reject(new Error('WHOOPS'));
      });

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.Promise.reject(new Error('WHOOPS'));

      promise.then(function(value){
        // Code here doesn't run because the promise is rejected!
      }, function(reason){
        // reason.message === 'WHOOPS'
      });
      ```

      @method reject
      @static
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise rejected with the given `reason`.
    */
    __exports__['default'] = function reject(reason, label) {
        /*jshint validthis:true */
        var Constructor = this;
        var promise = new Constructor(noop, label);
        _reject(promise, reason);
        return promise;
    };
});
define('rsvp/promise/resolve', [
    '../-internal',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var noop = __dependency1__.noop;
    var _resolve = __dependency1__.resolve;
    /**
      `RSVP.Promise.resolve` returns a promise that will become resolved with the
      passed `value`. It is shorthand for the following:

      ```javascript
      var promise = new RSVP.Promise(function(resolve, reject){
        resolve(1);
      });

      promise.then(function(value){
        // value === 1
      });
      ```

      Instead of writing the above, your code now simply becomes the following:

      ```javascript
      var promise = RSVP.Promise.resolve(1);

      promise.then(function(value){
        // value === 1
      });
      ```

      @method resolve
      @static
      @param {Any} value value that the returned promise will be resolved with
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    __exports__['default'] = function resolve(object, label) {
        /*jshint validthis:true */
        var Constructor = this;
        if (object && typeof object === 'object' && object.constructor === Constructor) {
            return object;
        }
        var promise = new Constructor(noop, label);
        _resolve(promise, object);
        return promise;
    };
});
define('rsvp/race', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.race`.

      @method race
      @static
      @for RSVP
      @param {Array} array Array of promises.
      @param {String} label An optional label. This is useful
      for tooling.
     */
    __exports__['default'] = function race(array, label) {
        return Promise.race(array, label);
    };
});
define('rsvp/reject', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.reject`.

      @method reject
      @static
      @for RSVP
      @param {Any} reason value that the returned promise will be rejected with.
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise rejected with the given `reason`.
    */
    __exports__['default'] = function reject(reason, label) {
        return Promise.reject(reason, label);
    };
});
define('rsvp/resolve', [
    './promise',
    'exports'
], function (__dependency1__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    /**
      This is a convenient alias for `RSVP.Promise.resolve`.

      @method resolve
      @static
      @for RSVP
      @param {Any} value value that the returned promise will be resolved with
      @param {String} label optional string for identifying the returned promise.
      Useful for tooling.
      @return {Promise} a promise that will become fulfilled with the given
      `value`
    */
    __exports__['default'] = function resolve(value, label) {
        return Promise.resolve(value, label);
    };
});
define('rsvp/rethrow', ['exports'], function (__exports__) {
    'use strict';
    /**
      `RSVP.rethrow` will rethrow an error on the next turn of the JavaScript event
      loop in order to aid debugging.

      Promises A+ specifies that any exceptions that occur with a promise must be
      caught by the promises implementation and bubbled to the last handler. For
      this reason, it is recommended that you always specify a second rejection
      handler function to `then`. However, `RSVP.rethrow` will throw the exception
      outside of the promise, so it bubbles up to your console if in the browser,
      or domain/cause uncaught exception in Node. `rethrow` will also throw the
      error again so the error can be handled by the promise per the spec.

      ```javascript
      function throws(){
        throw new Error('Whoops!');
      }

      var promise = new RSVP.Promise(function(resolve, reject){
        throws();
      });

      promise.catch(RSVP.rethrow).then(function(){
        // Code here doesn't run because the promise became rejected due to an
        // error!
      }, function (err){
        // handle the error here
      });
      ```

      The 'Whoops' error will be thrown on the next turn of the event loop
      and you can watch for it in your console. You can also handle it using a
      rejection handler given to `.then` or `.catch` on the returned promise.

      @method rethrow
      @static
      @for RSVP
      @param {Error} reason reason the promise became rejected.
      @throws Error
      @static
    */
    __exports__['default'] = function rethrow(reason) {
        setTimeout(function () {
            throw reason;
        });
        throw reason;
    };
});
define('rsvp/utils', ['exports'], function (__exports__) {
    'use strict';
    function objectOrFunction(x) {
        return typeof x === 'function' || typeof x === 'object' && x !== null;
    }
    __exports__.objectOrFunction = objectOrFunction;
    function isFunction(x) {
        return typeof x === 'function';
    }
    __exports__.isFunction = isFunction;
    function isMaybeThenable(x) {
        return typeof x === 'object' && x !== null;
    }
    __exports__.isMaybeThenable = isMaybeThenable;
    var _isArray;
    if (!Array.isArray) {
        _isArray = function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
        };
    } else {
        _isArray = Array.isArray;
    }
    var isArray = _isArray;
    __exports__.isArray = isArray;
    // Date.now is not available in browsers < IE9
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
    var now = Date.now || function () {
            return new Date().getTime();
        };
    __exports__.now = now;
    var o_create = Object.create || function (object) {
            var o = function () {
            };
            o.prototype = object;
            return o;
        };
    __exports__.o_create = o_create;
});
define('rsvp', [
    './rsvp/promise',
    './rsvp/events',
    './rsvp/node',
    './rsvp/all',
    './rsvp/all-settled',
    './rsvp/race',
    './rsvp/hash',
    './rsvp/hash-settled',
    './rsvp/rethrow',
    './rsvp/defer',
    './rsvp/config',
    './rsvp/map',
    './rsvp/resolve',
    './rsvp/reject',
    './rsvp/filter',
    './rsvp/asap',
    'exports'
], function (__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __exports__) {
    'use strict';
    var Promise = __dependency1__['default'];
    var EventTarget = __dependency2__['default'];
    var denodeify = __dependency3__['default'];
    var all = __dependency4__['default'];
    var allSettled = __dependency5__['default'];
    var race = __dependency6__['default'];
    var hash = __dependency7__['default'];
    var hashSettled = __dependency8__['default'];
    var rethrow = __dependency9__['default'];
    var defer = __dependency10__['default'];
    var config = __dependency11__.config;
    var configure = __dependency11__.configure;
    var map = __dependency12__['default'];
    var resolve = __dependency13__['default'];
    var reject = __dependency14__['default'];
    var filter = __dependency15__['default'];
    var asap = __dependency16__['default'];
    config.async = asap;
    // default async is asap;
    function async(callback, arg) {
        config.async(callback, arg);
    }
    function on() {
        config.on.apply(config, arguments);
    }
    function off() {
        config.off.apply(config, arguments);
    }
    // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
    if (typeof window !== 'undefined' && typeof window.__PROMISE_INSTRUMENTATION__ === 'object') {
        var callbacks = window.__PROMISE_INSTRUMENTATION__;
        configure('instrument', true);
        for (var eventName in callbacks) {
            if (callbacks.hasOwnProperty(eventName)) {
                on(eventName, callbacks[eventName]);
            }
        }
    }
    __exports__.Promise = Promise;
    __exports__.EventTarget = EventTarget;
    __exports__.all = all;
    __exports__.allSettled = allSettled;
    __exports__.race = race;
    __exports__.hash = hash;
    __exports__.hashSettled = hashSettled;
    __exports__.rethrow = rethrow;
    __exports__.defer = defer;
    __exports__.denodeify = denodeify;
    __exports__.configure = configure;
    __exports__.on = on;
    __exports__.off = off;
    __exports__.resolve = resolve;
    __exports__.reject = reject;
    __exports__.async = async;
    __exports__.map = map;
    __exports__.filter = filter;
});
define("spiceworks-sdk/card", 
  ["conductor","conductor/card","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Conductor = __dependency1__["default"];

    var card = Conductor.card;

    __exports__.card = card;
  });
define("spiceworks-sdk", 
  ["spiceworks-sdk/card","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var card = __dependency1__.card;

    __exports__.card = card;
  });
global.SW = require('spiceworks-sdk');
}(self));