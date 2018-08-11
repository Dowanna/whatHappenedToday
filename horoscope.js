"use strict";
const Alexa = require("alexa-sdk");
const attributeSign = "sign";
const horoscopeTableName = "HoroscopeSkillTable";

// 占い結果の定義
const fortunes = [
  { score: "good", description: "星みっつで良いでしょう" },
  { score: "normal", description: "星ふたつで普通でしょう" },
  { score: "bad", description: "星ひとつでイマイチでしょう" }
];

const states = {
  SYNASTRYMODE: "__SYNASTRYMODE"
};

const synastries = [
  { score: "good", description: "相性いいね" },
  { score: "normal", description: "相性普通ね" },
  { score: "bad", description: "相性最悪ね" }
];

const HELP_REPROMPT = "どうしますか？";
const REPROMPT = "もう一度お願いします";

// Lambda関数のメイン処理
exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context); // Alexaオブジェクトのインスタンス生成
  alexa.appId = process.env.APP_ID;
  alexa.dynamoDBTableName = horoscopeTableName;
  alexa.registerHandlers(handlers, synastryHandlers); // ハンドラの登録
  alexa.execute(); // インスタンスの実行
};

var synastryHandlers = Alexa.CreateStateHandler(states.SYNASTRYMODE, {
  HoroscopeIntent: function() {
    this.handler.state = ""; // ハンドラのステートをリセット
    this.attributes["STATE"] = undefined; // ここもリセットしないとdynamodbに保存されてしまう
    var yourSign = this.attributes[attributeSign];
    var oppSign = this.event.request.intent.slots.StarSign.value;
    var synastry = synastries[Math.floor(Math.random() * 3)]; // ランダムに占い結果を取得
    var message = `${yourSign}と${oppSign}は${synastry.description}`;
    this.emit(":tell", message);
    console.log(message);
  },
  Unhandled: function() {
    this.emit(":ask", REPROMPT, REPROMPT);
  }
});

var handlers = {
  // インテントに紐付かないリクエスト
  LaunchRequest: function() {
    this.emit("AMAZON.HelpIntent"); // AMAZON.HelpIntentの呼び出し
  },
  // スキルの使い方を尋ねるインテント
  "AMAZON.HelpIntent": function() {
    this.emit(
      ":ask",
      "今日の運勢を占います。" +
        "たとえば、うらないでふたご座の運勢を教えてと聞いてください",
      HELP_REPROMPT
    );
  },
  Unhandled: function() {
    this.emit(":ask", "もう一度お願いします");
  },
  // 対話モデルで定義した、占いを実行するインテント
  HoroscopeIntent: function() {
    var sign = this.event.request.intent.slots.StarSign.value; // スロットStarSignを参照
    var fortune = fortunes[Math.floor(Math.random() * 3)]; // ランダムに占い結果を取得
    this.attributes[attributeSign] = sign; // セッションあトリビュートに保存
    this.handler.state = states.SYNASTRYMODE; // このハンドラの状態を保存
    var message =
      "今日の" +
      sign +
      "の運勢は" +
      fortune.description +
      "相性を占うので相手の運勢をおしえてください"; // 応答メッセージ文字列の作成
    this.emit(":ask", message, REPROMPT); // レスポンスの生成
    console.log(message);
  },
  SynastryIntent: function() {
    if (this.attributes[attributeSign]) {
      this.handler.state = states.SYNASTRYMODE;
      const sign = this.attributes[attributeSign];
      const message = `あなたの星座は${sign}ですね。相手の星座をおしえてください`;
      this.emit(":ask", message, REPROMPT);
    } else {
      this.emit("AMAZON.HelpIntent");
    }
  },
  SessionEndedRequest: function() {
    this.emit(":saveState", true);
  }
};
