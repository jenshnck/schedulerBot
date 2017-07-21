var mongoose = require('mongoose');

var User = mongoose.model('User', {
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
  User: User
}
