module RSVP from "rsvp";
import Card from "./card";

var accessTokens = {};
var windowFeatures = "width=460,height=420,menubar=no,toolbar=no,status=no,scrollbars=no";
var identityServer = "https://accounts.spiceworks.com";

var isEmbedded = (function(){
  var result = sandblaster.detect();
  return (result.framed && (result.sandboxed || result.sandboxed === null));
})();

function messageReceiver(event) {
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
  var token = event.data.accessToken;
  this.targetWindow.close();

  // cache
  accessTokens[this.clientId] = token;
  // "return"
  if (this.deferred) {
    this.deferred.resolve(token);
  }
}

function createIdentityUrl(clientId, path) {
  return (identityServer +
          path +
          '?response_type=token' +
          '&client_id=' + clientId +
          '&redirect_uri=' + encodeURIComponent('/oauth/callback'));
}

function loginWithAPI(instance) {
  var service = (new Card()).services('login');
  service.request('access_token', {oauth_uid: instance.clientId}).then(
    function(token){
      accessTokens[instance.clientId] = token.token;
      instance.deferred.resolve(token.token);
    },
    function(error){
      instance.deferred.reject(error);
    }
  );
}

function loginWithWindow(instance) {
  var url = createIdentityUrl(instance.clientId, '/oauth/sign_in');
  instance.targetWindow = window.open(url, null, windowFeatures);
}

function Login(args) {
  args = args || {};
  if (typeof args.clientId === 'undefined') {
    throw new Error("'clientId' must be provided in args");
  }

  this.clientId = args.clientId;
  this.targetWindow = null;
  this.deferred = null;

  window.addEventListener('message', messageReceiver.bind(this), false);
}

Login.prototype = {

  login: function() {
    this.deferred = RSVP.defer();
    if (accessTokens[this.clientId]) {
      this.deferred.resolve(accessTokens[this.clientId]);
    }
    else {
      if (isEmbedded){
        loginWithAPI(this);
      }
      else {
        loginWithWindow(this);
      }
    }
    return this.deferred.promise;
  },

  create: function() {
    this.deferred = RSVP.defer();
    var url = createIdentityUrl(this.clientId, '/oauth/users/new');
    this.targetWindow = window.open(url, null, windowFeatures);
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
