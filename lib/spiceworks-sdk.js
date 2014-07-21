import Conductor from "conductor";
import { card } from "spiceworks-sdk/card";

self.Conductor = Conductor;
self.Oasis = Conductor.Oasis;
self.oasis = new self.Oasis();
self.oasis.autoInitializeSandbox();

export {
  oasis,
  card
};
