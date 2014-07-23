var card = new SW.Card();

var assertionsService = card.services('assertions');
var pongService = card.services('pong');

try {
  pongService.request('ping').then(function (response) {
    assertionsService.send('fail');
  });
} catch (e) {
  assertionsService.send('ok', {
    bool: e instanceof UndefinedCapability,
    message: 'it should throw an exception when trying to use a capability that is unprovided'
  });
}
