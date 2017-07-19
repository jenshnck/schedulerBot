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

var WebClient = require('@slack/client').WebClient;
var bot_token = process.env.SLACK_BOT_TOKEN;
var web = new WebClient(bot_token);

mongoose.connect('mongodb://Prateek:123@ds163672.mlab.com:63672/scheduler-bot', function(){
  console.log('Connected to Mongo');
})

// create an oauth2client that runs based on the google calendar
// api I requested
const CLIENT_ID = '479081305544-bql64pmv7ob5aktf7i1mocicf4vvcn4p.apps.googleusercontent.com'
const CLIENT_SECRET = 'UFB_e08W8doSnrtXlEV1_0VI'


// Incoming route for all slack messages
app.post('/slack/actions', (req, res) =>{
  //res.status(200).end() // best practice to respond with 200 status
  var actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
  var message = {
      "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].name,
      "replace_original": false
  }

  var attachments = {
  as_user: true,
  };

  var payload = req.body.payload;
  payload = JSON.parse(payload);
  var slackId = payload.user.id;
  payload = payload.actions[0].value;
  payload = JSON.parse(payload);

  payload = Object.assign(payload, {slackId: slackId});
  console.log('PAYLOAD');
  console.log(payload);

  var oauth2Client = new OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:3001/oauthcallback'
  );
  Token.findOne({slackId: payload.slackId}, function(err, token){
    if(err || !token){
      console.log('Could not find token with slackId ' + payload.slackId);
      // if you cannot find the token in the database with the given
      // slack Id, then you know they are a new user and can proceed
      // with authentication
      var url = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: 'https://www.googleapis.com/auth/calendar',
        state: payload
      });
      res.send(url)
    } else {
      // otherwise, just set the credentials to the token we already found
      // and let the user know that they are already authenticated
      oauth2Client.setCredentials(token.tokens);
      res.send('already authenticated! You\'re good to go')
    }
  })

  // if(actionJSONPayload.actions[0].name === 'confirm'){
  //   res.status(200).send({
  //     replace_original: true,
  //     text: 'Your meeting has been created!'
  //   })
  // } else if(actionJSONPayload.actions[0].name === 'cancel'){
  //   res.status(200).send({
  //     replace_original: true,
  //     text: 'You have cancelled!'
  //   })
  // } else {
  //   res.status(200).send({
  //     replace_original: true,
  //     text: 'Your meeting has been created!'
  //   });
  // }

})

// app.get('/test', function(req, res){
//   var payload = JSON.parse('{"slackId":"1","people":["Otto","Maria"],"meeting":"meeting","purpose":"discuss potatos","time":"23:45:00","date":"2017-07-21"}');
//   console.log(payload.meeting);
//   var oauth2Client = new OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     'http://localhost:3000/oauthcallback'
//   );
//   Token.findOne({slackId: payload.slackId}, function(err, token){
//     if(err || !token){
//       // if you cannot find the token in the database with the given
//       // slack Id, then you know they are a new user and can proceed
//       // with authentication
//       var url = oauth2Client.generateAuthUrl({
//         access_type: 'offline',
//         prompt: 'consent',
//         scope: 'https://www.googleapis.com/auth/calendar',
//         state: payload.slackId
//       });
//       res.redirect(url)
//     } else {
//       // otherwise, just set the credentials to the token we already found
//       // and let the user know that they are already authenticated
//       oauth2Client.setCredentials(token.tokens);
//       slackRequest(oauth2Client, payload);
//       res.send('already authenticated! You\'re good to go')
//     }
//   })
// })

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

// This is
function slackRequest(googleClient, data){
  var event = null;
  if(data.meeting){
    event = createMeeting(data)
  }
  // otherwise, it's a reminder
  else {
    event = createReminder(data)
  }

  // Actually insert the event into the calendar
  calendar.events.insert({
    auth: googleClient,
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

/*
  {
    "people":["Otto","Maria"],
    "purpose":"discuss potatos",
    "time":"02:00:00",
    "date":"2017-07-21"
  }
*/


function createMeeting(data){
  // calculate end dateTime
  var arr = data.time.split(':');
  var endTime, endDate;
  if (parseInt(arr[0]) === 23) {
    endTime = ['00', arr[1], arr[2]].join(':');
    var arr2 = data.date.split('-');
    endDate = [arr2[0], arr2[1], parseInt(arr2[2])+1].join('-');
  } else {
    endTime = [parseInt(arr[0])+1, arr[1], arr[2]].join(':');
    endDate = data.date;
  }

  // Make event
  var event = {
    'summary': data.purpose,
    'start': {
      'dateTime': data.date + 'T' + data.time,
      'timeZone': 'America/Los_Angeles'
    },
    'end': {
      'dateTime': endDate + 'T' + endTime,
      'timeZone': 'America/Los_Angeles'
    },
    'attendees': data.people,
  };
  return event;
}

function createReminder(googleClient, data){
  var event = {
    'summary': data.purpose,
    'start': {
      'date': data.date
    },
    'end': {
      'date': data.date
    },
    'attendees': data.people,
  };
  return event;
}

var PORT = 3001;
app.listen(PORT, function(){
  console.log('App listening on port ' + PORT);
})
