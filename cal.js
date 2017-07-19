(function setup() {
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
  var plus = google.plus('v1');

  var WebClient = require('@slack/client').WebClient;
  var bot_token = process.env.SLACK_BOT_TOKEN;
  var web = new WebClient(bot_token);

  mongoose.connect('mongodb://Prateek:123@ds163672.mlab.com:63672/scheduler-bot', 
  function() {
    console.log('Connected to Mongo');
  })
}())

// Incoming route for all slack messages
app.post('/slack/actions', (req, res) => {
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
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:'+process.env.PORT+'/oauthcallback'
  );
  Token.findOne({slackId: payload.slackId}, function(err, token){
    if(err || !token){
      console.log('Could not find token with slackId ' + payload.slackId);
      // if you cannot find the token in the database with the given
      // slack Id, then you know they are a new user and can proceed with authentication
      var url = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/plus.me'
        ],
        state: payload.slackId
      });
      res.send(url)
    } else {
      // otherwise, just set the credentials to the token we already found
      // and let the user know that they are already authenticated
      oauth2Client.setCredentials(token.tokens);

      slackRequest(oauth2Client, payload);
      res.send('already authenticated! You\'re good to go')
    }
  })
})

// This runs when the user accepts or denies access to their google calendar.
app.get('/oauthcallback', function(req, res) {
  if(req.query.error) {
    res.send('You have denied access to your google calendar');
  } else {
    var oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET, 
      'http://localhost:'+process.env.PORT+'/oauthcallback'
    );

    oauth2Client.getToken(req.query.code, function (err, tokens) {
      if (!err) {
        // set the current credentials to the person who just authenticated
        oauth2Client.setCredentials(tokens);
        var email = ''
        // get the user's Google account address 
        plus.people.get({
          userId: 'me',
          auth: oauth2Client, 
          fields: emails
          }, function (err, response) {
            var user = JSON.parse(response)
            email = user.value; 
          });

        // create a new token object with the slackId and the auth tokens
        var tkn = new Token({
          slackId: req.query.state,
          tokens: tokens, 
          email: email
        });

        // save the new token obejct to mongo
        tkn.save(function(err, token){
          if(err){
            console.log('Error saving new token', err);
          } else {
            console.log('successfully saved new user!');
          }
        })
      }
    })
  }
})

// This is
function slackRequest(googleClient, data) {
  var event = null;
  if(data.meeting) {
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
    resource: event
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
  });
}

/* Sample data 
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

  var attendeeEmails = []
  data.people.forEach((slackId) => {
    Token.find({slackId: slackId }, function(err, user) {
     if (err) {
       console.log('Error! No user found with this email address.')
       return; 
     } else {
       attendeeEmails.push({email: user.email})
     }
    })
  })
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
    'attendees': attendeeEmails,
    };
    return event;
  }

  function createReminder(data) {
    var event = {
      'summary': data.purpose,
      'start': {
        'date': data.date
      },
      'end': {
        'date': data.date
      }
    };
    return event;
}

app.listen(process.env.PORT, function(){
  console.log('App listening on port ' + process.env.PORT);
})

/*
    GOOGLE CALENDAR OAUTH2
    sample:
    https://github.com/google/google-api-nodejs-client/blob/master/samples/oauth2.js
    walk through:
    https://github.com/google/google-api-nodejs-client#retrieve-authorization-code
*/

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