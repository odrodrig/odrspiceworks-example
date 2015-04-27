(function() {
  "use strict";

  var card = new SW.Card();

  card.services('helpdesk').request('tickets').then(function (data) {
    document.getElementById('tickets_response').innerHTML = JSON.stringify(data);
  });

}());
