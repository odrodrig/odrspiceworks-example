
function CardService(card, capability){
  this.promise = card.oasis.connect(capability);
}

CardService.prototype = {
  send: function (event, data) {
    this.promise.then(function (port) {
      port.send(event, data);
    });

    return this;
  },

  on: function (event, callback) {
    this.promise.then(function (port) {
      port.on(event, callback);
    });

    return this;
  }
};

export default CardService;
