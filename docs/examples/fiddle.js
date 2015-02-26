(function(){

  var index = 0;

  $( "#run" ).click(function() {
    processCommand();
  });

  $( "#clear" ).click(function() {
    clear();
  });

  function evaluate(str) {

    try {
      return eval(str);
    }
    catch(err) {
      return log(err.message);
    }

  }

  function processCommand() {
    evaluate($('#in').val());
  }

  function clear() {
    $( "#out" ).empty();
  }

  function log(text) {

    if(isJSON(text)) {
      outputJSON(text);
    }
    else {
      $("#out").append("<p>=> " + text + "</p>");
    }

  }

  function isJSON(text) {
    try {
      JSON.parse(text);
    } catch (e) {
      return false;
    }
    return true;
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
