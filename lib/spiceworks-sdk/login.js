module RSVP from "rsvp";

var accessTokens = {};
var windowFeatures = "width=460,height=420,menubar=no,toolbar=no,status=no,scrollbars=no";
var identityServer = "https://accounts.spiceworks.com";
// developer
identityServer = "http://localhost:3000";

function Login(args) {
  args = args || {};
  if (typeof args.clientId === 'undefined') {
    throw new Error("'clientId' must be provided in args");
  }

  this.clientId = args.clientId;
  this.targetWindow = null;
  this.deferred = null;

  var createIdentityUrl = function(path) {
    return (identityServer +
            path +
            '?response_type=token' +
            '&client_id=' + this.clientId +
            '&redirect_uri=' + encodeURIComponent('/oauth/callback?client_id=' + this.clientId));
  };
  this.createIdentityUrl = createIdentityUrl;

  var messageReceiver = function(event) {
    if (event.source !== this.targetWindow) {
      return;
    }
    if (event.origin !== identityServer) {
      return;
    }
    if (event.data.messageType !== 'access_token') {
      return;
    }
    if (event.data.clientId !== this.clientId) {
      return;
    }

    this.targetWindow.close();

    // save and "return"
    accessTokens[this.clientId] = event.data.accessToken;
    if (this.deferred) {
      this.deferred.resolve(accessTokens[this.clientId]);
    }
  };

  window.addEventListener('message', messageReceiver.bind(this), false);
}

Login.prototype = {

  login: function() {
    this.deferred = RSVP.defer();
    if (accessTokens[this.clientId]) {
      this.deferred.resolve(accessTokens[this.clientId]);
    }
    else {
      this.targetWindow = window.open(this.createIdentityUrl('/oauth/sign_in'), null, windowFeatures);
    }
    return this.deferred.promise;
  },

  create: function() {
    this.deferred = RSVP.defer();
    this.targetWindow = window.open(this.createIdentityUrl('/oauth/users/new'), null, windowFeatures);
    return this.deferred.promise;
  },

  // syntax sugar to match the rest of the library
  // e.g. request('login').then()
  request: function(action, options) {
    var args = [].slice.call(arguments).splice(1);
    return this[action].apply(this, args);
  }
};

export default Login;
