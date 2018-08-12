"use strict";
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const fetch = require("node-fetch");

const dateFactPattern = /^\*\s?[\[[\d]{4}.*\]\]/;
const removePattern = /.en.|\{|\}|\[|\]|\||\*|\<\!--.*--\>|\<.*\>|仮リンク|:/g;
const factDynamoTableName = "alexa-fact-table";
const timestamp = new Date().getTime();
const today = process.argv[2];
const month = today.substring(0, 2);
const day = today.substring(2, 4);
const filePath = path.join(__dirname, month.concat(day, ".json"));
const todayInJapanese = month.concat("月", day, "日");

let downloadToFile = () => {
  // jsonfile in format "0301.json" but query must be 3月1日 without 0 padding
  let queryDate = Number(month)
    .toString()
    .concat("月", Number(day).toString(), "日");

  let percentEncodedToday = encodeURIComponent(queryDate);

  // Only fetch data which failed before
  // if (!day.startsWith("0")) {
  //   return;
  // }

  // console.log(`getting facts for: ${queryDate}`);

  let url = "https://ja.wikipedia.org/w/api.php?format=json&prop=revisions&action=query&rvprop=content&utf8&rvslots=main&rvprop=content&formatversion=2".concat(
    `&titles=${percentEncodedToday}`
  );
  fetch(url).then(res => {
    return new Promise((resolve, reject) => {
      const dest = fs.createWriteStream(filePath);
      res.body.pipe(dest);
      res.body.on("error", err => {
        reject(err);
      });
      dest.on("finish", () => {
        parseAndSendToDynamo();
      });
      dest.on("error", err => {
        reject(err);
      });
    });
  });
};

let parseAndSendToDynamo = () => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.log(`file read error: ${err}`);
      return;
    }
    let output = {};
    output["date"] = month.concat("月", day, "日");
    output["facts"] = [];

    let parsedData = JSON.parse(data);
    let pageId = parsedData.query.pages;
    let mainContents =
      parsedData.query.pages[0].revisions[0].slots.main["content"];

    let factContents = mainContents
      .substring(0, mainContents.indexOf("== 誕生日 =="))
      .split("\n");

    factContents.forEach(content => {
      if (content.match(/市制施行|.{2}市|.{2}村|改称|殺|死|事故/g)) {
        // console.log(`removing content ${content}`);
      } else {
        let rawDateFact = content.match(dateFactPattern);
        if (rawDateFact != null) {
          let dataFact = rawDateFact.input.replace(removePattern, "").trim();
          let dataFactArray = dataFact.split(" - ");
          output.facts.push({
            year: dataFactArray[0],
            fact: dataFactArray[1]
          });
        }
      }
    });

    let dynamoDb = new AWS.DynamoDB.DocumentClient();

    const params = {
      TableName: factDynamoTableName,
      Item: {
        date: output.date,
        facts: output.facts,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    };

    dynamoDb.put(params, err => {
      if (err) {
        console.log(`dynamoDb save error: ${err}`);
      }
    });
  });
};

parseAndSendToDynamo();
// downloadToFile();
