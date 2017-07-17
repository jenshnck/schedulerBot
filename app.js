// var RtmClient = require('@slack/client').RtmClient;
// var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
//
// var bot_token = process.env.SLACK_BOT_TOKEN || '';
//
// var rtm = new RtmClient(bot_token);
//
// // The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload if you want to cache it
// rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
//   console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
// });
//
// rtm.start();


/*
    GOOGLE CALENDAR OAUTH2
    sample:
    https://github.com/google/google-api-nodejs-client/blob/master/samples/oauth2.js
    walk through:
    https://github.com/google/google-api-nodejs-client#retrieve-authorization-code
*/

var express = require('express');
var app = express();

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var oauth2Client = new OAuth2(
  '479081305544-bql64pmv7ob5aktf7i1mocicf4vvcn4p.apps.googleusercontent.com',
  'UFB_e08W8doSnrtXlEV1_0VI',
  'http://localhost:3000'
);

var url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',

  // If you only need one scope you can pass it as a string
  scope: 'https://www.googleapis.com/auth/calendar',

  // Optional property that passes state parameters to redirect URI
  // state: { foo: 'bar' }
});

console.log(url);

app.listen(3000, function(){
  console.log('App listening on port 3000!');
})
