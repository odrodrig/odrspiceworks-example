import Oasis from "oasis";

var InventoryService = Oasis.Service.extend({
  initialize: function(port){
    this.sandbox.inventoryProxyPort = port;
  },
  requests: {
    devices: null
  }
});

export default InventoryService;
