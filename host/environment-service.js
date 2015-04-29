import Oasis from "oasis";

var EnvironmentService = Oasis.Service.extend({
  initialize: function () {
    this.send('activate', this.data());
  },
  events: {
    navigate: null
  },
  requests: {
    environment: null,
    users: null,
    user: null
  },
  data: null //extend this property to send in data on activation
});

export default EnvironmentService;
