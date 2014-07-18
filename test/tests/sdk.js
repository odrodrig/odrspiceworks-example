/**
 * spiceworks-sdk
 *
 *    Library test
 */

(function () {
  'use strict';

  describe('SW JS SDK', function() {
    it('defines SW global', function() {
      expect(SW).to.be.ok;
    });

    describe('SW cards', function () {
      it('defines a card constructor', function () {
        expect(SW.card).to.be.ok;
      });

      // it('can load cards', function () {
      //   this.conductor = new Conductor();
      //   this.conductor.configure("allowSameOrigin", true);
      // });
    });
  });
})();
