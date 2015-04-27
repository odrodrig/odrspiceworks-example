(function() {
  "use strict";

  var card = new SW.Card();

  var renderWonkaMeme = function (blob) {
    var container = document.getElementById('wonka_meme');
    var img = document.createElement('img');
    img.onload = function(e) {
      window.URL.revokeObjectURL(img.src);
    };
    img.src = window.URL.createObjectURL(blob);
    container.replaceChild(img, container.firstChild);
  };

  var getWonkaMeme = function (topText, bottomText) {
    var url = "https://ronreiter-meme-generator.p.mashape.com/meme?font=Impact&font_size=30&meme=Condescending+Wonka";
    var req = new XMLHttpRequest();

    url += "&top=" + encodeURIComponent(topText) + "&bottom=" + encodeURIComponent(bottomText);
    req.onload = function (e) {
      if (this.status == 200) {
        renderWonkaMeme(this.response);
      }
    };
    req.responseType = "blob";
    req.open("get", url, true);
    req.setRequestHeader("X-Mashape-Key", "NVRPxM9ni1msh43Ean5G8VxNzq8ep1SiFonjsnOWIRyttaMld7");
    req.send();
  };

  var showWonkaMeme = function (id) {
    card.services('helpdesk').request('ticket', id).then(function (data) {
      var mostRecentComment = data.comments[0];

      if (mostRecentComment) {
        getWonkaMeme(mostRecentComment.body + '?', 'Let me Google that for you.')
      } else {
        getWonkaMeme('No activity yet?', 'Might be time to get started.')
      }
    });
  };

  card.services('helpdesk').on('ticket:show', function(id){
    showWonkaMeme(id);
  });

}());
