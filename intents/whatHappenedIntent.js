const AWS = require("aws-sdk");
const dialogues = require("../dialogues/main");

// SessionAttributeNames
const NEXT_FACT = "nextFact";
const USER_DATE = "userDate";
const FACT_CACHE = "factCache";

// Database
const factDynamoTableName = "alexa-fact-table";

// Services
const parseUserDate = require("../service/parseUserDate");

// Helper Method to change 811 -> 0811
function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function ifNullSetToday(userDate) {
  const today = new Date();
  if (!userDate) {
    userDate = pad((today.getMonth() + 1).toString(), 2).concat(
      "月",
      pad(today.getDate().toString(), 2),
      "日"
    );
    console.log(`using default date, today ${userDate}`);
    return userDate;
  } else {
    return userDate;
  }
}

function ifExistsSetUserInput(slots, userDate) {
  if (slots != null) {
    if (slots.UserDate.value != null) {
      try {
        userDate = parseUserDate(slots.UserDate.value.split("-"));
      } catch (error) {
        throw error;
      }
      console.log(`Got user date ${userDate}`);
    }
  }
  return userDate;
}

function generateMessage(prefix, data, factNumber, userDate) {
  return prefix.concat(
    `${data.facts[factNumber].year}の${userDate}, ${
      data.facts[factNumber].fact
    }。もっと聞きたい？`
  );
}

let WhatHappenedIntent = function() {
  let dynamoDb = new AWS.DynamoDB.DocumentClient();
  let message = "";

  // if first session, no USER_DATE specified in session, so use today as default date
  userDate = ifNullSetToday(this.attributes[USER_DATE]);

  // if user wants to hear about diff date
  try {
    userDate = ifExistsSetUserInput(this.event.request.intent.slots, userDate);
  } catch (error) {
    console.log(error);
    this.emit(":ask", dialogues.INVALID_DATE, dialogues.INVALID_DATE);
  }

  this.attributes[USER_DATE] = userDate;

  // initialize cache object and nextFactNumber if nonexisting
  if (!this.attributes[FACT_CACHE]) {
    console.log("first ever session. Initialize FACT_CACHE attribute");
    this.attributes[FACT_CACHE] = {};
  }
  if (!this.attributes[NEXT_FACT]) {
    console.log("first ever session. Initialize NEXT_FACT attribute");
    this.attributes[NEXT_FACT] = {};
  }

  let todaysFactNumber = this.attributes[NEXT_FACT][userDate];
  let todaysFactCache = this.attributes[FACT_CACHE][userDate];

  if (todaysFactCache) {
    if (!todaysFactNumber) {
      this.attributes[NEXT_FACT][userDate] = todaysFactCache.facts.length - 1;
    }

    if (todaysFactNumber < 0) {
      console.log("no more data");
      message = message.concat("もうデータが無いので、最初から繰り返すね。");
      this.attributes[NEXT_FACT][userDate] = todaysFactCache.facts.length - 1;
    }

    message = generateMessage(
      message,
      todaysFactCache,
      this.attributes[NEXT_FACT][userDate],
      userDate
    );

    this.attributes[NEXT_FACT][userDate] -= 1;

    this.emit(":ask", message, dialogues.REPROMPT);
    return;
  }

  // if no cache, fetch from db
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

    // store as cache
    this.attributes[FACT_CACHE][userDate] = data;

    // if first time to access this date's fact, store which fact was last returned
    if (!todaysFactNumber) {
      this.attributes[NEXT_FACT][userDate] = data.facts.length - 1;
    }

    message = generateMessage(
      message,
      data,
      this.attributes[NEXT_FACT][userDate],
      userDate
    );

    this.attributes[NEXT_FACT][userDate] -= 1;

    this.emit(":ask", message, dialogues.REPROMPT);
    console.log(`message: ${message}`);
  });
};

module.exports = WhatHappenedIntent;
module.exports.parse;
