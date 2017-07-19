var mongoose = require('mongoose');

var Token = mongoose.model('Token', {
  slackId: {
    type: String
  },
  tokens: {
    type: Object
  }, 
  email: {
    type: String
  }
})

module.exports={
  Token: Token
}
