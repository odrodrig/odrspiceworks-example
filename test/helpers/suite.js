import { a_forEach } from "oasis/shims";

var sandboxes = [],
    destinationUrl = window.location.protocol + "//" + window.location.hostname + ":" + (parseInt(window.location.port, 10) + 1);

function iframeOptions(options) {
  if (options.adapter === undefined) { options.adapter = Oasis.adapters.iframe; }
  options.url = options.url.replace(/\.js/, '.html');

  if(!options.url.match(/^http/)) {
    options.url = destinationUrl + '/' + options.url;
  }
}

function createSandbox(options) {
  var sandbox = window.oasis.createSandbox(options);
  sandboxes.push(sandbox);
  return sandbox;
}

function createIframeSandbox(options) {
  iframeOptions(options);
  return createSandbox(options);
}


function registerIframe(options) {
  iframeOptions(options);
  window.oasis.register(options);
}

function configure() {
  return window.oasis.configure.apply(window.oasis, arguments);
}

export function iframeOasis() {
  return {
    configure: configure,
    register: registerIframe,
    createSandbox: createIframeSandbox,
  };
}

export function setup() {
  window.oasis = new Oasis();
  window.oasis.logger.enable();
}

export function teardown() {
  a_forEach.call(sandboxes, function (sandbox) {
    sandbox.terminate();
  });
  sandboxes = [];

  Oasis.reset();
}
