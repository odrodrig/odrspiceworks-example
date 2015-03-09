import Oasis from "oasis";

var ReportingService = Oasis.Service.extend({
  initialize: function(port){
    this.sandbox.reportingProxyPort = port;
  },
  requests: {
    'reports': null,
    'report': null,
    'report:run': null
  }
});

export default ReportingService;
