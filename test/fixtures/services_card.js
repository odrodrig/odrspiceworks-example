var card = new SW.Card();

card.services('assertions').send('ok', {
  bool: true,
  message: "send could be used to send messages to named services"
});
