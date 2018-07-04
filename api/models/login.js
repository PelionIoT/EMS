var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LoginCredentials = new Schema({
    access_token: {
        type: String,
        required: true
    },
    account_id: {
        type: String
    },
    token_type: {
        type: String,
        default: "bearer"
    },
    expires_in: {
        type: Number
    },
    username: {
        type: String
    },
    iat: {
        type: Number
    },
    userID: {
        type: String
    }
});

module.exports = mongoose.model('ems_logincredentials', LoginCredentials);