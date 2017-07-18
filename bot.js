var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var apiai = require('apiai');
var app = apiai(process.env.APIAI_CLI);

console.log('@slack/client', require('@slack/client'));

var bot_token = process.env.SLACK_BOT_TOKEN;

var rtm = new RtmClient(bot_token);

var route;
var userIDObj = {};


rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED,  (rtmStartData) => {
  for (const c of rtmStartData.channels) {
    console.log(c);
	  if (c.is_member && c.name ==='test') { route = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

rtm.on(RTM_EVENTS.MESSAGE, function(response) {
    console.log('responnnnnnse', response)
    if (response.type !== 'message' || response.user === 'U6A3AAM5K') return;

    var apiAI = new Promise(function(resolve, reject) {
        var request = app.textRequest(response.text, {
            sessionId: '123456789',
            resetContexts: true
        });

        request.on('response', function(response) {
            console.log(response.result.parameters);
            resolve(response.result.parameters)
        });

        request.on('error', function(error) {
            console.log('error in promise reject');
            reject(error)
        });

        request.end();
    })

    apiAI.then(function(response) {

        rtm.sendMessage('What is your email?', route)

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