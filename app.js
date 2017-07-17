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


app.get('/oauthcallback', function(req, res){
  var code = req.query.code;
  res.send('req.query.code: ' + req.query.code);

  oauth2Client.getToken(code, function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      oauth2Client.setCredentials(tokens);
      listEvents(oauth2Client)
    }
  })
})


function listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
}


var oauth2Client = new OAuth2(
  '479081305544-bql64pmv7ob5aktf7i1mocicf4vvcn4p.apps.googleusercontent.com',
  'UFB_e08W8doSnrtXlEV1_0VI',
  'http://localhost:3000/oauthcallback'
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
