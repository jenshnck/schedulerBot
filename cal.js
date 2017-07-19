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

app.post('/slack/actions', (req, res) => {
  res.status(200).end() // best practice to respond with 200 status
  console.log(req.body.actions);
  var message = {
    "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].name,
    "replace_original": false
  };

  var slackId = req.body.user.id
  var tokens
  var user1

  User.findOne({slackId: slackId}, function(user, err) {
    tokens = user.slackId
    user1 = user
  })
  
  if (tokens) {
  // Parse the req coming from Slack. Create an object that looks like the following. 
  const event = req.body; 

  var oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET, 
    'http://localhost:3000/oauthcallback'
  );

  oauth2Client.setCredentials(  
    user1[slackId]
  )

  var value = JSON.parse(actions[0].value)

  if (value.meeting) {
    createMeeting(oauth2client, value) 
  } else {
    createReminder(oauth2client, value)
  }
}  


  // Send the request to Google Calendar

//   } else {
    
//     var oauth2Client = new OAuth2(
//       process.env.GOOGLE_CLIENT_ID,
//       process.env.GOOGLE_CLIENT_SECRET, 
//       'http://localhost:3000/oauthcallback'
//     );

//     var url = oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       prompt: 'consent',
//       scope: 'https://www.googleapis.com/auth/calendar',
//       state: req.body.user.id
//     });

//     res.redirect(url)
//   }
// })  

// This route is only run at the beginning of a user's messages
// with the bot in order to authenticate them. It also runs if they
// are not authenticated and try to send an edit to their calendar
  
// This runs when the user accepts or denies access to their
// google calendar.
app.get('/oauthcallback', function(req, res) {
  if(req.query.error) {
    res.send('You have denied access to your google calendar');
  } else {
    var oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET, 
      'http://localhost:3000/oauthcallback'
    );

    oauth2Client.getToken(req.query.code, function (err, tokens) {
      if (!err) {
        // set the current credentials to the person who just authenticated
        oauth2Client.setCredentials(tokens);
        console.log('tokens =', tokens); 
        // save this to the database
        var user = new User('User', { state: tokens }); 
        user.save(function (err) {
          if (err) {
            console.log(err)
          } else {
            console.log('Successfully saved the user to the DB!')
            res.send('You successfully authenticated your Slack account!')
          }
        })  
      }
    })
  }
})


//TODO: implement based on incoming data
function createMeeting(oauth2Client, data) {
  var calendar = google.calendar('v3');
  var endTime 
  var endDate

  const data = {
    time: '23:45:00',
    date: '2017-07-21'
  }

  var arr = data.time.split(':'); 

  if (parseInt(arr[0]) === 23) {
    endTime = ['00', arr[1], arr[2]].join(':');
    var arr2 = data.date.split('-'); 
    endDate = [arr2[0], arr2[1], parseInt(arr2[2])+1].join('-')
  } else {
    var endTime = [parseInt(arr[0])+1, arr[1], arr[2]].join(':');
    var endDate = data.date
  }
  

  const event = {
    'summary': data.purpose, 
    'start': { 
      'dateTime': data.date + 'T'+ data.time+'-07:00', 
      'timeZone': 'America/Los_Angeles'
    }, 
    'end': {
      'dateTime': endDate + 'T'+ endTime+'-07:00', 
      'timeZone': 'America/Los_Angeles'
    }, 
    'attendees': data.people
  }

  calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    resource: event
  }, function(err, event) {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
    console.log('Event created: %s', event.htmlLink);
    res.render('Event created!')
  });
}  

//TODO: implement based on incoming data
function createReminder(slackId, data){
  var calendar = google.calendar('v3');

  const event = {
    'summary': data.purpose, 
    'start': { 
      'dateTime': data.date, 
      'timeZone': 'America/Los_Angeles'
    }, 
    'end': {
      'dateTime': data.date, 
      'timeZone': 'America/Los_Angeles'
    }, 
    'attendees': data.people
  }

  calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    resource: event
  }, function(err, event) {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
    console.log('Event created: %s', event.htmlLink);
    res.render('Event created!')
  });
}

app.listen(3000, function(){
  console.log('App listening on port 3000!');
})
