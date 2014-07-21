import Conductor from "conductor";

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

export default AssertionService;
