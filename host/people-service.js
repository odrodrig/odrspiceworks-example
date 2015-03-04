import Oasis from "oasis";

var PeopleService = Oasis.Service.extend({
  initialize: function(port){
    this.sandbox.peopleProxyPort = port;
  },
  requests: {
    people: null,
    person: null
  }
});

export default PeopleService;
