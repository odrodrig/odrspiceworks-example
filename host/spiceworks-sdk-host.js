import Oasis from "oasis";
import EnvironmentService from "environment-service";
import HelpdeskService from "helpdesk-service";
import InventoryService from "inventory-service";
import PeopleService from "people-service";

var oasis = new Oasis();
oasis.autoInitializeSandbox();

export {
  oasis,
  EnvironmentService,
  HelpdeskService,
  InventoryService,
  PeopleService
};
