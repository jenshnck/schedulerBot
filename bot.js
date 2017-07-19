var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var apiai = require('apiai');
var app = apiai(process.env.APIAI_CLI);

var WebClient = require('@slack/client').WebClient;
var token = process.env.SLACK_API_TOKEN || '';
var web = new WebClient(token);

var dateFormat = require('dateformat');

console.log('@slack/client', require('@slack/client'));

var bot_token = process.env.SLACK_BOT_TOKEN;

var rtm = new RtmClient(bot_token);

var route;
var userIDObj = {};

//authentication for bot
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED,  (rtmStartData) => {
  for (const c of rtmStartData.channels) {
    console.log(c);
    if (c.is_member && c.name ==='test') { route = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});
//receives user message
rtm.on(RTM_EVENTS.MESSAGE, function(response) {
  if (response.type !== 'message' || response.user === 'U6A3AAM5K' || response.bot_id === 'B6B8DVDJA') return;
//pass response on to api.ai
  var apiAI = new Promise(function(resolve, reject) {
    var request = app.textRequest(response.text, {
      sessionId: '123456789',
      resetContexts: true
    });
//log response
    request.on('response', function(response) {
      console.log(response.result);
      resolve(response.result.parameters)
    });

    request.on('error', function(error) {
      console.log('error in promise reject');
      reject(error)
    });

    request.end();
  })
//parae api response and send interactive message to user
  apiAI.then(function(response) {
    console.log('responsseeeeeeeeeeeeeee', response);
    var attachments = {
      as_user: false,
        attachments: [
          {
            "text": "Choose a game to play",
            "fallback": "You are unable to choose a game",
            "callback_id": "wopr_game",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "actions": [
                {
                    "name": "game",
                    "text": "Chess",
                    "type": "button",
                    "value": "chess"
                },
                {
                    "name": "game",
                    "text": "Falken's Maze",
                    "type": "button",
                    "value": "maze"
                },
                {
                    "name": "game",
                    "text": "Thermonuclear War",
                    "style": "danger",
                    "type": "button",
                    "value": "war",
                    "confirm": {
                        "title": "Are you sure?",
                        "text": "Wouldn't you prefer a good game of chess?",
                        "ok_text": "Yes",
                        "dismiss_text": "No"
                    }
                }
            ]
        }
        ]
      };
    web.chat.postMessage(route, 'Creat a task ' + response.purpose + ' on ' + dateFormat(response.date, "fullDate"), attachments, function(err, res) {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
      }
    });

    return null
  }).catch(function(err) {
    console.log('ERROR IN APIAI', err)
  })


});

// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  console.log('client', CLIENT_EVENTS);
  rtm.sendMessage("*Here I am, fam!*", route);
});


function buildDM(idArr) {
  for (var i=0; i < idArr.length; i++) {
    var dm = idArr[i].id;
    var userId = idArr[i].user;
    userIDObj[userId] = dm
  }
}


rtm.start();
