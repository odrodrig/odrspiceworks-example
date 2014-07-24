import { iframeOasis, setup, teardown } from "test/helpers/suite";

describe('SW SDK hosting', function () {
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
