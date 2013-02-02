var mongoose = require('mongoose');

// exports
var Model = module.exports = {};

Model.Traffic = mongoose.model('Traffic', require('./traffic'));
Model.Beer = mongoose.model('Beer', require('./beer'));
Model.User = mongoose.model('User', require('./user'));