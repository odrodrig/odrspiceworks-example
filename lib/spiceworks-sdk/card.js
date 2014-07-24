import Oasis from "oasis";
import CardService from "./card-service";
module RSVP from "rsvp";
import EnvironmentConsumer from "./environment-consumer";

function Card(options) {
  this.options = options = options || {};
  this.oasis = SW.oasis || new Oasis();
  this.cardServices = {};

  this.activationDeferred = RSVP.defer();
  this.activationDeferred.promise.fail( RSVP.rethrow );

  this.oasis.connect({
    consumers: {
      environment: EnvironmentConsumer.extend({card: this})
    }
  });
}

Card.prototype = {
  services: function (capability) {
    if(!this.cardServices[capability]){
      this.cardServices[capability] = new CardService(this, capability);
    }

    return this.cardServices[capability];
  },

  onActivate: function (callback) {
    var card = this;
    card.activationDeferred.promise.then(function (data) {
      return callback.call(card, data);
    });
  }
};

export default Card;
