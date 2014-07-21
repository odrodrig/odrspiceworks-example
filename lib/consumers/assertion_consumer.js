import Conductor from "conductor";

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

export default AssertionConsumer;
