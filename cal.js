/*
    GOOGLE CALENDAR OAUTH2
    sample:
    https://github.com/google/google-api-nodejs-client/blob/master/samples/oauth2.js
    walk through:
    https://github.com/google/google-api-nodejs-client#retrieve-authorization-code
*/

var mongoose = require('mongoose');
var {Token} = require('./models.js')
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
mongoose.connect('mongodb://Prateek:123@ds163672.mlab.com:63672/scheduler-bot', function(){
  console.log('Connected to Mongo');
})

// create an oauth2client that runs based on the google calendar
// api I requested
const CLIENT_ID = '479081305544-bql64pmv7ob5aktf7i1mocicf4vvcn4p.apps.googleusercontent.com'
const CLIENT_SECRET = 'UFB_e08W8doSnrtXlEV1_0VI'

var oauth2Client = new OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:3000/oauthcallback'
);

//TODO: Remove at end, this route is for testing
app.post('/slack/actions', (req, res) =>{
    res.status(200).end() // best practice to respond with 200 status
    var actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
    console.log(actionJSONPayload);
    var message = {
        "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].name,
        "replace_original": false
    }
    // sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
})

app.get('/test', function(req, res){
  slackRequest(req.query.slackId);
  res.send('Check the log')
});

// This route is only run at the beginning of a user's messages
// with the bot in order to authenticate them. It also runs if they
// are not authenticated and try to send an edit to their calendar
app.get('/authUser', function(req, res){
  // Token.find({'slackId': req.query.slackId}, function(err, token){
  //   if(err || !token){
  //     console.log('Could not find token with slackId ' + req.query.slackId);
  //     // if you cannot find the token in the database with the given
  //     // slack Id, then you know they are a new user and can proceed
  //     // with authentication
  //     var url = oauth2Client.generateAuthUrl({
  //       access_type: 'online',
  //       scope: 'https://www.googleapis.com/auth/calendar',
  //       state: req.query.slackId
  //     });
  //     res.redirect(url)
  //   } else {
  //     // otherwise, just set the credentials to the token we already found
  //     // and let the user know that they are already authenticated
  //     oauth2Client.setCredentials(token.tokens);
  //     res.send('already authenticated! You\'re good to go')
  //   }
  // })
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
        // create a new token object with the slackId and the auth tokens
        var tkn = new Token({
          slackId: req.query.state,
          tokens: tokens
        });

        // save the new token obejct to mongo
        tkn.save(function(err, token){
          if(err){
            console.log('Error saving new token', err);
          } else {
            console.log('successfully saved new user!');
          }
        })

        // set the current credentials to the person who just authenticated
        oauth2Client.setCredentials(tokens);
      }
    })
    res.send('You successfully authenticated your calendar!!');
  }
})

function slackRequest(slackId, data){
  var tokens = slackToCal[slackId];

  if(tokens){
    oauth2Client.setCredentials(tokens);
    // if this field is populated, it is a meeting
    //TODO: test create meeting
    /*
      date: ‘2017-07-22’,
      invitees: [],
      meeting: ‘’,
      purpose: ‘to call Simon’,
      reminder: ‘remind’,
      time: ‘’
    */


    createReminder({
                    date: "2017-07-19",
                    purpose: "testing 123",

                  });
  }
  //  if(data.meeting){
  //     createMeeting(data)
  //   }
  //   // otherwise, it's a reminder
  //   else {
  //
  //   }
  // } else {
  //   // auth if no token can be found
  // }
}

//TODO: implement based on incoming data
function createMeeting(data){

}

//TODO: implement based on incoming data
function createReminder(data){
  // sample code: https://developers.google.com/google-apps/calendar/v3/reference/events/insert
  // POST https://www.googleapis.com/calendar/v3/calendars/primary/events
  // create the event based on data

  var event = {
    'summary': data.purpose,
    'start': {
      'date': data.date
    },
    'end': {
      'date': data.date
    },
    'attendees': [
      {'email': 'lpage@example.com'},
      {'email': 'sbrin@example.com'},
    ],
  };

  // Actually insert the event into the calendar
  calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });
}

app.listen(3000, function(){
  console.log('App listening on port 3000!');
})
