const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const user = new Schema({
    
    name:{
        type:String
    },
    interests : [ {type:String} ],
    otp : { type:Number,
     },
    isVerified : {
        type:Boolean,
        default:false
    },
    location:{
        type:String
    }

},{
    timestamps:true
});
user.plugin(passportLocalMongoose);
const User = mongoose.model('User',user);
module.exports = User;