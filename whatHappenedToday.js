"use strict";
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");

// Dialogues
const HELP_REPROMPT =
  "昔カレンダーです。今日は何があった日だっけ？とか、8月12日はなにがあった日だっけ？とか聞いてみてね。もっと聴きたい場合は「もっと」と言ってください";
const REPROMPT = "ごめん！もう一度お願い";
const BYEBYE = "さようなら！よいいちにちを";

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

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = process.env.APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var handlers = {
  LaunchRequest: function() {
    this.emit("AMAZON.HelpIntent");
  },
  "AMAZON.HelpIntent": function() {
    this.emit(":ask", HELP_REPROMPT);
  },
  Unhandled: function() {
    this.emit(":ask", REPROMPT);
  },
  "AMAZON.YesIntent": function() {
    this.emit("WhatHappenedIntent");
  },
  "AMAZON.NoIntent": function() {
    this.emit(":tell", BYEBYE);
    this.emit("AMAZON.StopIntent");
  },
  // Entry point of this skill
  // Will provide a fact, update the counter (to avoid duplicate respone), and end session
  WhatHappenedIntent: function() {
    let dynamoDb = new AWS.DynamoDB.DocumentClient();
    let userDate = this.attributes[USER_DATE];
    let message = "";

    if (userDate == null) {
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

    if (this.attributes[FACT_CACHE] == null) {
      this.attributes[FACT_CACHE] = {};
    }

    if (this.attributes[FACT_CACHE][userDate] != null) {
      console.log(`responding from cache`);
      let data = this.attributes[FACT_CACHE][userDate];
      message = message.concat(
        `${
          data.facts[this.attributes[NEXT_FACT][userDate]].year
        }の${userDate}, ${
          data.facts[this.attributes[NEXT_FACT][userDate]].fact
        }。`
      );

      // Update session data
      this.attributes[NEXT_FACT][userDate] -= 1;

      this.emit(":ask", message, REPROMPT);
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

      if (this.attributes[NEXT_FACT] == null) {
        console.log(`NEXT_FACT session attribute does not exist`);
        this.attributes[NEXT_FACT] = {};
      }

      if (this.attributes[NEXT_FACT][userDate] == null) {
        console.log(`NEXT_FACT session attribute for today does not exist`);
        this.attributes[NEXT_FACT][userDate] = data.facts.length - 1;
      }

      if (this.attributes[NEXT_FACT][userDate] < 0) {
        console.log("もうデータがないよ");
        message = message.concat("もうデータが無いので、最初から繰り返すね。");
        this.attributes[NEXT_FACT][userDate] = data.facts.length - 1;
      }

      message = message.concat(
        `${
          data.facts[this.attributes[NEXT_FACT][userDate]].year
        }の${userDate}, ${
          data.facts[this.attributes[NEXT_FACT][userDate]].fact
        }。`
      );

      // Update session data
      this.attributes[NEXT_FACT][userDate] -= 1;

      this.emit(":ask", message, REPROMPT);
      console.log(`message: ${message}`);
    });
  }
};

function parseAndReturn(data) {}
