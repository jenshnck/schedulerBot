var mongoose = require('mongoose');

var Token = mongoose.model('Token', {
  slackId: {
    type: String
  },
  tokens: {
    type: Object
  }
})

module.exports={
  Token: Token
}
