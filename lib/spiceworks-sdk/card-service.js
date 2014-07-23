module RSVP from "rsvp";

function CardService(card, capability){
  this.promise = card.oasis.connect(capability);
  this.name = capability;
}

CardService.prototype = {
  send: function (event, data) {
    this.promise.then(function (port) {
      port.send(event, data);
    });

    return this;
  },

  on: function (event, callback) {
    var binding = this;

    this.promise.then(function (port) {
      port.on(event, callback, binding);
    });

    return this;
  },

  request: function (requested) {
    var promise = this.promise;

    return RSVP.Promise(function (resolve, reject) {
      promise.then(function (port) {
        return port.request(requested);
      })
      .then(function (response) {
        resolve(response);
      }, function (error) {
        reject(error);
      });
    });
  }
};

export default CardService;
