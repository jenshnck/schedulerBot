/*
    GOOGLE CALENDAR OAUTH2
    sample:
    https://github.com/google/google-api-nodejs-client/blob/master/samples/oauth2.js
    walk through:
    https://github.com/google/google-api-nodejs-client#retrieve-authorization-code
*/

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var calendar = google.calendar('v3');

// This is a mapping from incoming slackIds to outgoing
// GCal access tokens. The pairing is made upon authorization
// and the token is used every time a request to change the
// user's calendar is made.
var slackToCal = {/*slackId (as a string): access_token*/};

// create an oauth2client that runs based on the google calendar
// api I requested
var oauth2Client = new OAuth2(
  '479081305544-bql64pmv7ob5aktf7i1mocicf4vvcn4p.apps.googleusercontent.com',
  'UFB_e08W8doSnrtXlEV1_0VI',
  'http://localhost:3000/oauthcallback'
);

// This route is only run at the beginning of a user's messages
// with the bot in order to authenticate them. It also runs if they
// are not authenticated and try to send an edit to their calendar
app.get('/authUser', function(req, res){
  var url = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: 'https://www.googleapis.com/auth/calendar',
    state: req.query.slackId
  });
  res.redirect(url)
})

// This runs when the user accepts or denies access to their
// google calendar.
app.get('/oauthcallback', function(req, res){
  if(req.query.error){
    res.send('You have denied access to your google calendar');
  } else {
    oauth2Client.getToken(req.query.code, function (err, tokens) {
      if (!err) {
        // update slackId to Calendar tokens mapping
        slackToCal[req.query.state] = tokens;
        // set the current credentials to the person who just authenticated
        oauth2Client.setCredentials(tokens);
      }
    })
    res.send('You successfully authenticated your calendar!!');
  }
})


//TODO: implement based on incoming data
function createMeeting(slackId, data){
  var tokens = slackToCal[slackId];
  if(tokens){
    oauth2Client.setCredentials(tokens);
    // create the event based on data
    // POST https://www.googleapis.com/calendar/v3/calendars/primary/events
  } else {
    // auth
  }
}

//TODO: implement based on incoming data
function createReminder(slackId, data){
  var tokens = slackToCal[slackId];
  if(tokens){
    oauth2Client.setCredentials(tokens);
    // create the event based on data
    // POST https://www.googleapis.com/calendar/v3/calendars/primary/events
  } else {
    // auth
  }
}

app.listen(3000, function(){
  console.log('App listening on port 3000!');
})
