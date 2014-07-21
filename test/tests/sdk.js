/**
 * spiceworks-sdk
 *
 *    Library test
 */

(function () {
  'use strict';

  describe('SW JS SDK', function() {
    var mochaFixture;

    before(function () {
      mochaFixture = document.getElementById('mocha-fixture');
    });

    describe('SW SDK hosting', function () {
      it('defines Conductor global', function() {
        assert.ok(Conductor);
      });

      it('can load a card', function () {
        var cardUrl = "fixtures/empty_card/empty_card.html";
        var conductor = newConductor();
        var card = conductor.load(cardUrl);
        card.appendTo(mochaFixture);

        var el = document.querySelectorAll('#mocha-fixture iframe');
        assert.equal(el.length, 1, "The card is in the DOM");
        assert.ok(el[0].src.indexOf(cardUrl) >= 0,
          "The card has the proper source");

        conductor.unload(card);
      });
    });

    describe('SW SDK frame', function () {
      var conductor, card;

      beforeEach(function () {
        conductor = newConductor();
      });

      afterEach(function () {
        conductor.unload(card);
      });

      it('defines SW global', function(done) {
        card = conductor.load("fixtures/activated_card/activated_card.html", 1, {
          services: {
            assertion: newAssertionService(done)
          }
        });
        card.appendTo(mochaFixture);
        // assertions in activated_card.js
      });

      it('activates a card', function(done) {
        card = conductor.load("fixtures/activated_card/activated_card.html", 1, {
          services: {
            assertion: newAssertionService(done)
          }
        });
        card.appendTo(mochaFixture);
        // assertions in activated_card.js
      });
    });
  });
})();
