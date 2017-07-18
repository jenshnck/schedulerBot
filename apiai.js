var apiai = require('apiai');
var axios = require('axios')

var app = apiai(process.env.APIAI_CLI);

var hi = null

var request = app.textRequest('remind me to go home', {
sessionId: "123456789",
resetContexts: true,
});

const myFirstPromise = new Promise((resolve, reject) => {

request.on('response', function(response) {
    hi = response.result.fulfillment.speech
    console.log(hi)
    console.log(response);
    resolve(hi);
});

request.on('error', function(error) {
    console.log(error);
});

request.end();
});
myFirstPromise.then((response)=>{
var request2 = app.textRequest(response, {
sessionId: "123456789",
});

request2.on('response', function(response) {
    console.log(response);
});

request2.on('error', function(error) {
    console.log(error);
});

request2.end();})

// axios({
//   method:'get',
//   url:'https://api.api.ai/v1/query?v=20150910&amp;query=remind&amp;lang=en&amp;sessionId=123456789',
//   sessionId: "12343245",
//   headers: {
//       Authorization: "Bearer bd22004466ce479f84dacc444850da09",
//   },
// })
//   .then(function(response) {
//   console.log(response);
// })
// .catch(function(err){
//     console.log("err", err);
// })
