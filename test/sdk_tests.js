import { iframeOasis, setup, teardown } from "test/helpers/suite";

describe('SW JS SDK', function() {
  var mochaFixture, oasis;

  beforeEach(function () {
    setup();
  });

  afterEach(function () {
    teardown();
  });

  before(function () {
    oasis = iframeOasis();
    mochaFixture = document.getElementById('mocha-fixture');
  });

  describe('SW SDK hosting', function () {
    it('can load a card', function () {
      var cardUrl = "fixtures/loading/empty_card.html";
      var sandbox = oasis.createSandbox({
        url: cardUrl,
        capabilities: []
      });

      mochaFixture.appendChild(sandbox.el);

      var el = document.querySelectorAll('#mocha-fixture iframe');
      assert.equal(el.length, 1, "The card is in the DOM");
      assert.ok(el[0].src.indexOf(cardUrl) >= 0,
        "The card has the proper source");

      sandbox.terminate();
    });
  });

  describe('SW SDK frame', function () {

    beforeEach(function () {
      window.oasis.log('Test started');
    });

    afterEach(function () {
      window.oasis.log('Test finished');
    });

    it("gives cards access to services via `send`", function(done) {
      var sandbox = oasis.createSandbox({
        url: "fixtures/services_card.html",
        capabilities: ['assertions'],
        services: {
          assertions: Oasis.Service.extend({
            events: {
              ok: function (data) {
                assert.ok(data.bool, data.message);
                done();
              }
            }
          })
        }
      });

      mochaFixture.appendChild(sandbox.el);
      // assertions in activated_card.js
    });

    it("gives cards access to service events via `on`", function(done) {
      var AssertionsService = Oasis.Service.extend({
        events: {
          ok: function(data) {
            assert.ok(data.bool, data.message);
            this.send('ping');
          },

          pong: function(data) {
            assert.ok(data.bool, data.message);
            done();
          }
        }
      });

      var sandbox = oasis.createSandbox({
        url: "fixtures/events_card.html",
        capabilities: ['assertions'],
        services: {
          assertions: AssertionsService
        }
      });

      mochaFixture.appendChild(sandbox.el);
      // assertions in activated_card.js
    });

    it("gives cards access to service requests via `request`", function(done) {
      var AssertionsService = Oasis.Service.extend({
        events: {
          ok: function(data) {
            assert.ok(data.bool, data.message);
            done();
          }
        },
        requests: {
          ping: function(data) {
            return 'pong';
          }
        }
      });

      var sandbox = oasis.createSandbox({
        url: "fixtures/requests_card.html",
        capabilities: ['assertions'],
        services: {
          assertions: AssertionsService
        }
      });

      mochaFixture.appendChild(sandbox.el);
      // assertions in activated_card.js
    });

    it.skip('limits a cards capabilities', function(done) {
      var sandbox = oasis.createSandbox({
        url: "fixtures/limited_card.html",
        capabilities: ['assertions'],
        services: {
          assertions: Oasis.Service.extend({
            events: {
              ok: function (data) {
                assert.ok(data.bool, data.message);
                done();
              },
              fail: function() {
                assert.fail();
                done();
              }
            }
          }),
          pong: Oasis.Service.extend({
            requests: {
              ping: function(data) {
                return 'pong';
              }
            }
          })
        }
      });

      mochaFixture.appendChild(sandbox.el);
      // assertions in activated_card.js
    });

    it.skip('activates a card', function(done) {
      card = conductor.load("fixtures/activation/activated_card.html", 1, {
        services: {
          assertion: newAssertionService(done)
        }
      });
      card.appendTo(mochaFixture);
      // assertions in activated_card.js
    });

  });
});
