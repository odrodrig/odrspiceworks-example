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

  window.addEventListener('message', this.messageReceiver.bind(this), false);
}

Login.prototype = {

  saveToken: function(token) {
    accessTokens[this.clientId] = token;
  },

  respond: function(args) {
    if (this.deferred) {
      this.deferred.resolve(args);
    }
  },

  messageReceiver: function() {
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
    this.saveToken(event.data.accessToken);
    this.respond(event.data.accessToken);
  },

  createIdentityUrl: function(path) {
    return (identityServer +
      path +
      '?response_type=token' +
      '&client_id=' + this.clientId +
      '&redirect_uri=' + encodeURIComponent('/oauth/callback?client_id=' + this.clientId));
  },

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
