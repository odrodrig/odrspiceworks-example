import Conductor from "conductor";

function init(options) {
  return Conductor.card(options);
}

function testing() {
  return 'test';
}

export {
  init,
  testing
};
