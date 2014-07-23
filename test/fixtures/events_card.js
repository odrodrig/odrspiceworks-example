var card = new SW.Card();

card.services('assertions')
  .send('ok', {
    bool: true,
    message: "send can be used to send messages to named services"
  })
  .on('ping', function (message) {
    this.send('pong', {
      bool: true,
      message: "'on' can be used to respond to events"
    });
  });
