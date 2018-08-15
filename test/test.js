const assert = require("chai").assert;
const whatHappenedIntent = require("../intents/whatHappenedIntent");

describe("whatHappanedIntent", function() {
  it("should launch", function() {
    whatHappenedIntent();
  });
});
