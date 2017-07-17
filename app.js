/*
    GOOGLE CALENDAR OAUTH2
    sample:
    https://github.com/google/google-api-nodejs-client/blob/master/samples/oauth2.js
    walk through:
    https://github.com/google/google-api-nodejs-client#retrieve-authorization-code
*/

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var oauth2Client = new OAuth2(
  '479081305544-e9r3ktb1108v2gisvd42sor7c9542abh.apps.googleusercontent.com',
  'ESrUzekQrRhqMA5UjIl_OC5Z',
  'http://localhost:3000'
);

var url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'online',

  // If you only need one scope you can pass it as a string
  scope: 'https://www.googleapis.com/auth/calendar',

  // Optional property that passes state parameters to redirect URI
  // state: { foo: 'bar' }
});

console.log(url);

// oauth2Client.getToken(code, function (err, tokens) {
//   // Now tokens contains an access_token and an optional refresh_token. Save them.
//   if (!err) {
//     //oauth2Client.setCredentials(tokens);
//     console.log(code);
//   }
// });
