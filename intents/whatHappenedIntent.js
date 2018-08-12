const AWS = require("aws-sdk");
const dialogues = require("../dialogues/main");

// SessionAttributeNames
const NEXT_FACT = "nextFact";
const USER_DATE = "userDate";
const FACT_CACHE = "factCache";

// Today
const today = new Date();
const dd = today.getDate().toString();
const mm = (today.getMonth() + 1).toString();

// Database
const factDynamoTableName = "alexa-fact-table";

// Helper Method
function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

let WhatHappenedIntent = function() {
  let dynamoDb = new AWS.DynamoDB.DocumentClient();
  let userDate = this.attributes[USER_DATE];
  let message = "";

  if (!userDate) {
    userDate = pad(mm, 2).concat("月", pad(dd, 2), "日");
    console.log(`using default date, today ${userDate}`);
  }

  // user wants to hear about diff date
  if (this.event.request.intent.slots != null) {
    if (this.event.request.intent.slots.UserDate.value != null) {
      let rawUserDates = this.event.request.intent.slots.UserDate.value.split(
        "-"
      );
      userDate = "".concat(rawUserDates[1], "月", rawUserDates[2], "日");
      console.log(`Got user date ${userDate}`);
    }
    this.attributes[USER_DATE] = userDate;
  }

  if (!this.attributes[FACT_CACHE]) {
    this.attributes[FACT_CACHE] = {};
  }

  if (this.attributes[FACT_CACHE][userDate]) {
    console.log(`responding from cache`);
    let data = this.attributes[FACT_CACHE][userDate];
    message = message.concat(
      `${data.facts[this.attributes[NEXT_FACT][userDate]].year}の${userDate}, ${
        data.facts[this.attributes[NEXT_FACT][userDate]].fact
      }。`
    );

    // Update session data
    this.attributes[NEXT_FACT][userDate] -= 1;

    this.emit(":ask", message, dialogues.REPROMPT);
    return;
  }

  const param = {
    TableName: factDynamoTableName,
    KeyConditionExpression: "#date=:date",
    ExpressionAttributeNames: {
      "#date": "date"
    },
    ExpressionAttributeValues: {
      ":date": userDate
    }
  };

  dynamoDb.query(param, (error, result) => {
    if (error) {
      console.log(error);
      return;
    }

    let data = result.Items[0];

    this.attributes[FACT_CACHE][userDate] = data;

    if (!this.attributes[NEXT_FACT]) {
      console.log(`NEXT_FACT session attribute does not exist`);
      this.attributes[NEXT_FACT] = {};
    }

    if (!this.attributes[NEXT_FACT][userDate]) {
      console.log(`NEXT_FACT session attribute for today does not exist`);
      this.attributes[NEXT_FACT][userDate] = data.facts.length - 1;
    }

    if (this.attributes[NEXT_FACT][userDate] < 0) {
      console.log("もうデータがないよ");
      message = message.concat("もうデータが無いので、最初から繰り返すね。");
      this.attributes[NEXT_FACT][userDate] = data.facts.length - 1;
    }

    message = message.concat(
      `${data.facts[this.attributes[NEXT_FACT][userDate]].year}の${userDate}, ${
        data.facts[this.attributes[NEXT_FACT][userDate]].fact
      }。`
    );

    // Update session data
    this.attributes[NEXT_FACT][userDate] -= 1;

    this.emit(":ask", message, dialogues.REPROMPT);
    console.log(`message: ${message}`);
  });
};

module.exports = WhatHappenedIntent;
