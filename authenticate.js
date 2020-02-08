const passport = require('passport');
const LocalStartegy = require('passport-local').Strategy;
const User = require('./models/users');
var jwtStrategy = require('passport-jwt').Strategy;
var Extractjwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var config = require('./config');


passport.use(new LocalStartegy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = (user)=>{
    return jwt.sign(user,config.secretKey,{expiresIn : 3600});
};

var opts = {};
opts.secretOrKey = config.secretKey;
opts.jwtFromRequest = Extractjwt.fromAuthHeaderAsBearerToken();

exports.jwtpassport= passport.use(new jwtStrategy(opts,(jwt_payload,done)=>{
    //console.log(jwt_payload);
    User.findOne({_id:jwt_payload._id},(err,user) =>{
        if(err){
            return done(err,false);
        }else if(user){
            return done(null,user);
        }
        else{
            return done(null ,false);
        }
    });
}));
exports.verifyUser = passport.authenticate('jwt',{session:false});