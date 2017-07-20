var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var apiai = require('apiai');
var app = apiai(process.env.APIAI_CLI);

var WebClient = require('@slack/client').WebClient;
// var token = process.env.SLACK_API_TOKEN || '';
var bot_token = process.env.SLACK_BOT_TOKEN;

var web = new WebClient(process.env.SLACK_BOT_TOKEN);

var dateFormat = require('dateformat');

var stringSimilarity = require('string-similarity');


var rtm = new RtmClient(bot_token);

var route;
var userIDObj = {};

var users = [];

// var userInfo = {
//   date: '',
//  'given-name': [],
//   meeting: '',
//   purpose: '',
//   reminder: '',
//   time: ''
// }

var reset = true;

//authentication for bot
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED,  (rtmStartData) => {
  for(var i = 0; i < rtmStartData.users.length; i++){
    users.push(rtmStartData.users[i]);
  }
  for (const c of rtmStartData.channels) {
    if (c.is_member && c.name ==='test') { route = c.id }
  }
  (`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});
//receives user message
rtm.on(RTM_EVENTS.MESSAGE, function(response) {
  if (response.type !== 'message' || response.user === 'U6A3AAM5K' || response.bot_id === 'B6A14BYH2') return;
  var user = response.user;
  var apiAI = new Promise(function(resolve, reject) {
    var request = app.textRequest(response.text, {
      sessionId: '123456789',
      resetContexts: reset
    });
//log response
    request.on('response', function(response) {
      // console.log(response.result);
      // userInfo.date = response.result.parameters.date;
      // userInfo['given-name'] = response.result.parameters['given-name'];
      // userInfo.meeting = response.result.parameters.meeting;
      // userInfo.purpose = response.result.parameters.purpose;
      // userInfo.reminder = response.result.parameters.reminder;
      // userInfo.time = response.result.parameters.time;
      resolve(response.result);
    });

    request.on('error', function(error) {
      console.log('error in promise reject');
      reject(error)
    });

    request.end();
  })
//parae api response and send interactive message to user
  apiAI.then(function(response) {
      if(response.parameters.reminder){
        if(response.parameters.purpose && response.parameters.date){
          var attachments = {
            username: 'schedulerBot',
            as_user: true,
            attachments: [
              {
                "fallback": "You are unable to complete the request",
                "callback_id": "wopr_game",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                  {
                    "name": "confirm",
                    "text": "Confirm",
                    "style": "success",
                    "type": "button",
                    "value": JSON.stringify({
                      "reminder": response.parameters.reminder,
                      "purpose": response.parameters.purpose,
                      "date": response.parameters.date,
                    }),
                  },
                  {
                    "name": "cancel",
                    "text": "Cancel",
                    "style": "danger",
                    "type": "button",
                    "value": "war",
                    "confirm": {
                      "title": "Are you sure?",
                      "text": "Wouldn't you prefer a good game of chess?",
                      "ok_text": "Yes",
                      "dismiss_text": "No"
                    }
                  },

                ]
              }
            ]
          };

          web.chat.postMessage(route, 'Creat a task ' + response.parameters.purpose + ' on ' + dateFormat(response.parameters.date, "fullDate"), attachments, function(err, res) {
            if (err) {
              console.log('Error 105:', err);
            } else {
              console.log('Message sent: ');
            }
          });

          web = new WebClient(process.env.SLACK_API_TOKEN);
            var reminders = getReminders(response.parameters.date);
            //console.log(reminders);
            for(var i = 0; i < reminders.length; i++){
              if(reminders[i]){
                web.reminders.add('Remember ' + response.parameters.purpose + ' on ' + dateFormat(response.parameters.date, "fullDate"), reminders[i], function(err, res) {
                  if (err) {
                    console.log('Reminder Error:');
                  } else {
                    console.log('Message sent: ', res);
                  }
                });
              }
            }

          reset = true;

        }else{
          rtm.sendMessage(response.fulfillment.speech, route);

          reset = false;
        }

      }else if(response.parameters.meeting){
        if(response.parameters.time && response.parameters.date){
          var people = response.parameters['given-name'];
          var realNames = [];
          var matchedNames = [];
          var matchedSlackId = [];
          for(var i = 0; i < users.length; i++){
            if(users[i].real_name){
              realNames.push(users[i].real_name);
            }
          }

          for(var i = 0; i < people.length; i++){
            console.log('hiiiiiiiiiii', people[i], realNames)
              var matched = stringSimilarity.findBestMatch(people[i], realNames).bestMatch.target;
              matchedNames.push(matched);
          }

            for(var j = 0; j < matchedNames.length; j++){
              for(var i = 0; i < users.length; i++){
                if(users[i].real_name === matchedNames[j]){
                  matchedSlackId.push(users[i].id);
                }
              }
            }

          var attachments = {
            as_user: true,
            attachments: [
              {
                "fallback": "You are unable to complete the request",
                "callback_id": "wopr_game",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                  {
                    "name": "confirm",
                    "text": "Confirm",
                    "style": "success",
                    "type": "button",
                    "value": JSON.stringify({
                      "people": matchedSlackId,
                      "meeting": response.parameters.meeting,
                      "purpose": response.parameters.purpose,
                      "time": response.parameters.time,
                      "date": response.parameters.date,
                    }),
                  },
                  {
                    "name": "cancel",
                    "text": "Cancel",
                    "style": "danger",
                    "type": "button",
                    "value": "war",
                    "confirm": {
                      "title": "Are you sure?",
                      "text": "Do you want to cancel the meeting?",
                      "ok_text": "Yes",
                      "dismiss_text": "No"
                    }
                  },
                ]
              }
            ]
          };



          web.chat.postMessage(route, 'Creat a task ' + response.parameters.purpose + ' on ' + dateFormat(response.parameters.date, "fullDate"), attachments, function(err, res) {
            if (err) {
              console.log('Error: 184', err);
            } else {
              //console.log('Message sent: ', res);
            }
          });

          var attachments1 = {
            as_user: true,
            "text": "Would you like to play a game?",
            "response_type": "in_channel",
            "attachments": [
              {
                "text": "Choose a game to play",
                "fallback": "If you could read this message, you'd be choosing something fun to do right now.",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "callback_id": "game_selection",
                "actions": [
                  {
                    "name": "games_list",
                    "text": "Pick a game...",
                    "type": "select",
                    "options": [
                      {
                        "text": "Hearts",
                        "value": "hearts"
                      },
                      {
                        "text": "Bridge",
                        "value": "bridge"
                      },
                      {
                        "text": "Checkers",
                        "value": "checkers"
                      },
                      {
                        "text": "Chess",
                        "value": "chess"
                      },
                      {
                        "text": "Poker",
                        "value": "poker"
                      },
                      {
                        "text": "Falken's Maze",
                        "value": "maze"
                      },
                      {
                        "text": "Global Thermonuclear War",
                        "value": "war"
                      }
                    ]
                  }
                ]
              }
            ]
          }

          web.chat.postMessage(route, "Unfortunately, that time won't work. Here are some available times.", attachments1, function(err, res) {
            if (err) {
              console.log('Error: 244', err);
            } else {
              //console.log('Message sent: ', res);
            }
          });

          web = new WebClient(process.env.SLACK_API_TOKEN);
            var reminders = getReminders(response.parameters.date);
            //console.log(reminders);
            for(var i = 0; i < reminders.length; i++){
              if(reminders[i]){
                web.reminders.add('Remember ' + response.parameters.purpose + ' on ' + dateFormat(response.parameters.date, "fullDate"), reminders[i], function(err, res) {
                  if (err) {
                    console.log('Reminder Error:', err);
                  } else {
                    //console.log('Message sent: ', res);
                  }
                });
              }
            }
            reset = true;
        }else{
          rtm.sendMessage(response.fulfillment.speech, route);

          reset = false;
        }

      }else{
        reset = true;
      }
  }).catch(function(err) {
    console.log('ERROR IN APIAI', err)
  })


});

// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  // console.log('clienttttttttt', CLIENT_EVENTS);
});

function getReminders(date){
  var future = new Date(date);
  var miliSeconds1 = future.getTime();
  var now = new Date();
  var miliSeconds2 = now.getTime();
  var diff = miliSeconds1 - miliSeconds2;
  var reminder1;
  var reminder24;
  if(diff <= 86400000){
    reminder24 = (future - 3600000)/1000;
  }else{
    reminder24 = (future - 3600000)/1000;
    reminder1 = (future - 86400000)/1000;
  }
  return [reminder24, reminder1];
}

// function buildDM(idArr) {
//   for (var i=0; i < idArr.length; i++) {
//     var dm = idArr[i].id;
//     var userId = idArr[i].user;
//     userIDObj[userId] = dm
//   }
// }


rtm.start();
