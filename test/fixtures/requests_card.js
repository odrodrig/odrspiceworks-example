var card = new SW.Card();

var assertionsService = card.services('assertions');

assertionsService.request('ping').then(function (response) {
  assertionsService.send('ok', {
    bool: response === 'pong',
    message: 'request can be used to request objects from a service'
  });
});
