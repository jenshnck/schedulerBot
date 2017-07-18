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

var users={};

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/auth', function(req, res) {
  console.log(req.query);

  var oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET, 
    'http://localhost:3000/oauthcallback'
);
  
  var url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    // If you only need one scope you can pass it as a string
    scope: 'https://www.googleapis.com/auth/calendar',
    // Optional property that passes state parameters to redirect URI
    state: encodeURIComponent(JSON.stringify(
      {slackId: req.query.id})
    )  
  })
  res.redirect(url)
})

app.get('/oauthcallback', function(req, res){
  console.log('Made it here')
  var code = req.query.code;

  var oauth2Client = new OAuth2(
    rocess.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET, 
    'http://localhost:3000/oauthcallback'
  );

  res.send('Congrats, you`ve given the app permission. Your code is: ',  req.query.code);

  oauth2Client.getToken(code, function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      console.log('tokens = ', tokens);
      oauth2Client.setCredentials(tokens);
      users[req.body.slackId] = tokens.auth_token;
      console.log(users)
    }
  })
})

app.post('/message', function(req, res) {
  var tokens = users[slackId]; 
  if (tokens) {
    // send the message to ai.api
  } else {
    res.redirect('/a')
  }
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

app.listen(3000, function(){
  console.log('App listening on port 3000!');
})
