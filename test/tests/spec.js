/**
 * spiceworks-sdk
 *
 *    Library test
 */

(function () {
  'use strict';

  describe('Basic library test', function() {
    it('defines SW', function() {
      var answer = SW.testing();
      expect(answer).to.equal('test');
    });
  });
})();
