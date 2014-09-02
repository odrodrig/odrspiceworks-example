import Oasis from "oasis";
module RSVP from "rsvp";

// GLOBAL: $.ajax

// NOTE: should this be imported?
//import ajaxRequest from "????????";
var ajaxRequest = function(url, options){
  return new RSVP.Promise(function(resolve, reject) {

    var options = options || {};

    options.success = function(data){
      resolve(data);
    };

    options.error = function(jqXHR, status, error){
      reject(arguments);
    };

    $.ajax(url, options);
  });
};
// 

var apiCall = function(filter, opts){
  var url = '/api/tickets.json';
  var data = opts || {};
  data.filter = filter;

  return ajaxRequest({url:url, data:data});
};

var _Service = Oasis.Service.extend({

  initialize: function(port){
    this.sandbox.ticketProxyPort = port;
  },
  requests: {
    unassigned: function(){
      return apiCall('unassigned');
    },
    open: function(){
      return apiCall('open');
    },
    pastDue: function(){
      return apiCall('past_due');
    },
    recent: function(){
      return apiCall('recent');
    },
    recentOpen: function(){
      return apiCall('recent_open');
    },
    closed: function(){
      return apiCall('closed');
    },
    assigned: function(){
      return apiCall('assigned');
    },
    requiringPurchase: function(){
      return apiCall('requiring_purchase');
    },
    email: function(addr){
      return apiCall('email', {email:addr});
    },
    openAndAssignedTo: function(userId){
      return apiCall('open_and_assigned_to', {user_id: userId});
    },
    openAndAssignedToCurrentUser: function(){
      return apiCall('open_and_assigned_to_current_user');
    },
    assignedToUserAndHasNotBeenViewed: function(userId){
      return apiCall('assigned_to_user_and_has_not_been_viewed', {user_id: userId});
    }

  }
});

export default _Service;
