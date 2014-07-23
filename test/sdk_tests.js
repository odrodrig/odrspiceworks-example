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
      window.oasis.log('Test finsihed');
    });

    it("cards have access to services via `on`", function(done) {
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

    it.skip('activates a card', function(done) {
      card = conductor.load("fixtures/activation/activated_card.html", 1, {
        services: {
          assertion: newAssertionService(done)
        }
      });
      card.appendTo(mochaFixture);
      // assertions in activated_card.js
    });

    it.skip('gives a card capabilities', function(done) {
      card = conductor.load("fixtures/capabilities/capabilities_card.html", 1, {
        services: {
          assertion: newAssertionService(done),
          tickets: Conductor.Oasis.Service
        }
      });
      card.appendTo(mochaFixture);
      // assertions in activated_card.js
    });

    it.skip('limits a cards capabilities', function(done) {
      card = conductor.load("fixtures/capabilities/limited_capabilities_card.html", 1, {
        services: {
          assertion: newAssertionService(done)
        }
      });
      card.appendTo(mochaFixture);
      // assertions in activated_card.js
    });
  });
});
