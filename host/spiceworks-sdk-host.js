import Oasis from "oasis";
import EnvironmentService from "environment-service";

self.Oasis = Oasis;
var oasis = new self.Oasis();
oasis.autoInitializeSandbox();

export {
  oasis,
  EnvironmentService
};
