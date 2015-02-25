(function(){

  $( "#run" ).click(function() {
    processCommand();
  });

  $( "#clear" ).click(function() {
    clear();
  });

  index = 0;
  var e = new Evaluator();

  function Evaluator() {
    this.env = {};
  }

  Evaluator.prototype.evaluate = function (str) {
    try {
      var __environment__ = this.env;
      with (__environment__) {
        return eval(str);
      }
    } catch (e) {
      return log(e.toString());
    }
  };

  function processCommand() {
    e.evaluate($('#in').val());
  }

  function clear() {
    // Delete div and that will delete all entries
    $("#out").remove();

    // Make sure to recreate it so next commands can get logged
    $("<div></div>").attr('id', "out").appendTo('body');
  }

  function log(text) {
    $("#out").append("<p>=> " + text + "</p>");
  }

  function outputJSON(json) {

    var divID = 'jsonView_';
    divID = divID.concat(index);

    $("<div></div>").attr('id', divID).appendTo('#out');
    var divIDHash = '#';
    divIDHash = divIDHash.concat(divID);
    $(divIDHash).JSONView(json);

    index++;

  }

}());
