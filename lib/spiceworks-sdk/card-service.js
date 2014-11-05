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

  request: function () {
    var service = this;
    var requestArgs = arguments;

    return RSVP.Promise(function (resolve, reject) {
      service.promise.then(function (port) {
        return port.request.apply(port, requestArgs);
      }, function (error) {
        console.error('Connection error! Could not connect to service %s', service.name);
        reject(error);
      })
      .then(function (response) {
        resolve(response);
      }, function (error) {
        console.error('Request error!');
        reject(error);
      });
    });
  }
};

export default CardService;
