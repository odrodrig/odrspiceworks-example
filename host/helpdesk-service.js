import Oasis from "oasis";

var HelpdeskService = Oasis.Service.extend({
  initialize: function(port){
    this.sandbox.helpdeskProxyPort = port;
  },
  requests: {
    'tickets': null,
    'ticket': null,
    'ticket:create': null
  }
});

export default HelpdeskService;
