import Conductor from "conductor";
import "conductor/card";
import AssertionConsumer from "consumers/assertion_consumer";

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

export {
  card
};
