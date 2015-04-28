import Oasis from "oasis";

var LoginService = Oasis.Service.extend({
  initialize: function(port) {
    this.sandbox.loginProxyPort = port;
  },
  requests: {
    access_token: null
  },
});

export default LoginService;
