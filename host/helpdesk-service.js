import Oasis from "oasis";

var HelpdeskService = Oasis.Service.extend({
  initialize: function(port){
    this.sandbox.helpdeskProxyPort = port;
  },
  requests: {
    tickets: null,
    unassigned: null,
    open: null,
    pastDue: null,
    recent: null,
    recentOpen: null,
    closed: null,
    assigned: null,
    requiringPurchase: null,
    email: null,
    openAndAssignedTo: null,
    openAndAssignedToCurrentUser: null,
    assignedToUserAndHasNotBeenViewed: null
  }
});

export default HelpdeskService;
