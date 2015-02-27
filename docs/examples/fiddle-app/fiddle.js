(function(){

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

    $('<div class="json-view"></div>').JSONView(json).appendTo("#out")

  }

}());
