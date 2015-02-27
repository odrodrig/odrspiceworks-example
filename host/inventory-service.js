import Oasis from "oasis";

var InventoryService = Oasis.Service.extend({
  initialize: function(port){
    this.sandbox.inventoryProxyPort = port;
  },
  requests: {
    devices: null,
    device: null,
    software: null
  }
});

export default InventoryService;
