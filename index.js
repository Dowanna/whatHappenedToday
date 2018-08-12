"use strict";
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");
const dialogues = require("dialogues/main");

// Intents
const whatHappenedIntent = require("intents/whatHappenedIntent");

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
    this.emit(":ask", dialogues.HELP_REPROMPT);
  },
  Unhandled: function() {
    this.emit(":ask", dialogues.REPROMPT);
  },
  "AMAZON.YesIntent": function() {
    this.emit("WhatHappenedIntent");
  },
  "AMAZON.NoIntent": function() {
    this.emit(":tell", dialogues.BYEBYE);
    this.emit("AMAZON.StopIntent");
  },
  WhatHappenedIntent: whatHappenedIntent
};
