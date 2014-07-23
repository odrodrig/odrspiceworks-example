import Oasis from "oasis";
import CardService from "./card-service";

function Card(options) {
  this.options = options = options || {};
  this.oasis = SW.oasis || new Oasis();
  this.cardServices = {};
}

Card.prototype = {
  services: function (capability) {
    if(!this.cardServices[capability]){
      this.cardServices[capability] = new CardService(this, capability);
    }

    return this.cardServices[capability];
  }
};

export default Card;
