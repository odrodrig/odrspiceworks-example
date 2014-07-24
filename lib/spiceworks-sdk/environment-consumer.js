import Oasis from "oasis";

var EnvironmentConsumer = Oasis.Consumer.extend({
  events: {
    activate: function (data) {
      this.card.activationDeferred.resolve(data);
    }
  }
});

export default EnvironmentConsumer;
