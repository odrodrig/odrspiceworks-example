var card = new SW.Card();

card.onActivate(function (data) {
  card.services('assertions').send('one',{
    received: data,
    message: 'called first onActivate handler'
  });
});

card.onActivate(function (data) {
  card.services('assertions').send('two',{
    received: data,
    message: 'called second onActivate handler'
  });
});
