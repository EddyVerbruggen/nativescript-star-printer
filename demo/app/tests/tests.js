var StarPrinter = require("nativescript-star-printer").StarPrinter;
var starPrinter = new StarPrinter();

describe("searchPrinters", function () {
  it("exists", function () {
    expect(starPrinter.searchPrinters).toBeDefined();
  });

  it("returns a promise", function () {
    expect(starPrinter.searchPrinters()).toEqual(jasmine.any(Promise));
  });

  /* disabled as this won't work on a sim anyway
  it("should resolve", function (done) {
    starPrinter.searchPrinters().then(
        function () {
          expect().toBe();
          done();
        },
        function () {
          fail("Should have worked");
        }
    )
  });
  */
});

describe("print", function () {
  it("exists", function () {
    expect(starPrinter.print).toBeDefined();
  });

  it("returns a promise", function () {
    expect(starPrinter.print()).toEqual(jasmine.any(Promise));
  });

  it("expects options to be passed in", function (done) {
    starPrinter.print().then(
        function () {
          fail("Should not have worked");
        },
        function () {
          expect().toBe();
          done();
        }
    )
  });
});