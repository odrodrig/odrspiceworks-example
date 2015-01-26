import Oasis from "oasis";
import { iframeOasis, setup, teardown } from "test/helpers/suite";
import { EnvironmentService } from "spiceworks-sdk-host";

describe('SW SDK frame', function () {
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

  it("calls onActivate handler with data on card creation", function(done) {
    var activationData = {
      user_id: '12345',
      user_email: 'artv@spiceworks.com'
    };

    var simpleDataEnvironmentService = EnvironmentService.extend({
      data: activationData
    });

    var AssertionsService = Oasis.Service.extend({
      events: {
        received: function(data) {
          assert.deepEqual(data.received, activationData, data.message);
          done();
        }
      }
    });

    var sandbox = oasis.createSandbox({
      url: "fixtures/activate_card.html",
      capabilities: ['environment', 'assertions'],
      services: {
        environment: simpleDataEnvironmentService,
        assertions: AssertionsService
      }
    });

    mochaFixture.appendChild(sandbox.el);
    // assertions in activated_card.js
  });

  it("can add multiple onActivate handlers", function(done) {
    var activationData = { user_id: '12345', user_email: 'artv@spiceworks.com' };

    var simpleDataEnvironmentService = EnvironmentService.extend({
      data: activationData
    });

    var AssertionsService = Oasis.Service.extend({
      events: {
        one: function(data) {
          this.oneFired = true;
          assert.deepEqual(data.received, activationData, data.message);
          this.finish();
        },
        two: function(data) {
          this.twoFired = true;
          assert.deepEqual(data.received, activationData, data.message);
          this.finish();
        }
      },
      oneFired: false,
      twoFired: false,
      finish: function () {
        if(this.oneFired && this.twoFired) { done(); }
      }
    });

    var sandbox = oasis.createSandbox({
      url: "fixtures/multi_activate_card.html",
      capabilities: ['environment', 'assertions'],
      services: {
        environment: simpleDataEnvironmentService,
        assertions: AssertionsService
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
