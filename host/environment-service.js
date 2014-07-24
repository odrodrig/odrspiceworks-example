import Oasis from "oasis";

var EnvironmentService = Oasis.Service.extend({
  initialize: function () {
    this.send('activate', this.data);
  },
  data: null //extend this property to send in data on activation
});

export default EnvironmentService;
