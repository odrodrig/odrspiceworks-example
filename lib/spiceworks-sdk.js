import Oasis from "oasis";
import Card from "spiceworks-sdk/card";

self.Oasis = Oasis;
var oasis = new self.Oasis();
oasis.autoInitializeSandbox();

export {
  oasis,
  Card
};
