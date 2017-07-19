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
      users[req.body.user.id] = tokens.auth_token;
      console.log(users); 

    } else {
      console.log('Error = ', err); 
    }
  })
})

app.post('/message', function(req, res) {
  
})

app.listen(3000, function(){
  console.log('App listening on port 3000!');
})
