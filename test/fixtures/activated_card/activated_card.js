SW.card({
  activate: function() {
    ok(typeof SW !== 'undefined', "SW namespace is defined");
    ok(true, "activated_card was activated");
    done();
  }
});
