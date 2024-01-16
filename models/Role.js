const mongoose =require('mongoose');
var Schema = mongoose.Schema;
var role = new Schema({
   "roleName": String
});
module.exports =  mongoose.model('roles', role);
