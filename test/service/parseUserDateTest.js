const assert = require("chai").assert;
const whatHappenedIntent = require("../../intents/whatHappenedIntent");
const parseUserDate = require("../../service/parseUserDate");

let generateTestData = (input, expected) => {
  return {
    input: input,
    expected: expected
  };
};

describe("parseUserDate", function() {
  it("shouldParse", function() {
    let testDatas = [];

    testDatas.push(generateTestData(["2018", "08", "16"], "08月16日"));
    testDatas.push(generateTestData(["2018", "01", "01"], "01月01日"));
    testDatas.push(generateTestData(["2018", "12", "31"], "12月31日"));

    testDatas.forEach(td => {
      let res = parseUserDate(td.input);
      assert.equal(res, td.expected);
    });
  });

  it("shouldNotParse", function() {
    let testDatas = [];

    testDatas.push(generateTestData(["2018", "13", "16"], ""));
    testDatas.push(generateTestData(["2018", "00", "16"], ""));
    testDatas.push(generateTestData(["2018", "a", "b"], ""));
    testDatas.push(generateTestData(["2018", "ww", "ddu19"], ""));
    testDatas.push(generateTestData(["", "", ""], ""));

    testDatas.forEach(td => {
      assert.throws(
        function() {
          parseUserDate(td.input);
        },
        Error,
        "invalid date format"
      );
    });
  });
});
