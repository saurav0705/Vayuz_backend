var express = require('express');
var Users = require('../models/users');
const bodyParser = require('body-parser');
var passport = require('passport');
const path = require('path');
var authenticate = require('../authenticate');
const multer = require('multer');
const storage = multer.diskStorage({
  destination : (req,file,cb) =>{
    cb(null,__dirname);
  },
  filename: (req,file,cb)=>{
    cb(null,file.originalname);
  }
})

const imgFilter = (req,file,cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg')
  {
    cb(null,true);
  }else{
    cb(new Error('invalid format jpeg or jpg accepted'),false);
  }
};

const upload = multer({storage:storage , limits : {
  fileSize: 1024*1024*5
},fileFilter:imgFilter})
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function otpSent(email,otp) {
  

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
   service:'gmail',
    auth: {
      user: '', // generated ethereal user
      pass: '' // generated ethereal password
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'saurav.aggarwal2020@gmail.com', // sender address
    to: email, // list of receivers
    subject: "OTP ✔", // Subject line
    text: "Here is the OTP", // plain text body
    html: "<b>"+otp+"</b>" // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}



const userRouter = express.Router();
userRouter.use(bodyParser.json());
/* GET users listing. */
userRouter.route('/')
.all((req,res,next)=>{
  res.statusCode = 200;
  res.setHeader('Content-type','application/json');
  next();
})
.get(authenticate.verifyUser,(req,res,next)=>{
  Users.findById(req.user._id)
  .then((user)=>{
      res.json({user});
  })

})
.put(authenticate.verifyUser,(req,res,next) => {
   Users.findById(req.user._id)
   .then((user)=>{
     user.interests= req.body.interests;
     user.save()
     .then(()=>{
       res.json('successfully stored');
     })
   },(err)=>next(err))
   .catch((err)=>next(err));
  
});

userRouter.post('/signup',upload.single('profile'),(req,res,next)=>{
  console.log('file--------------',req.file);
  Users.register(new Users({username:req.body.username}) , req.body.password,(err,user)=>{
    if(err){
      res.statusCode = 400;
      res.setHeader('Content-type','application/json');
      res.json({"ERROR":err});
    }
    else{
      user.name = req.body.name;
      user.interests = [];
      user.location = req.body.location;
      user.image = '\\routes\\'+req.file.originalname;
      user.otp= parseInt(Math.random()*100000);
      
      user.save()
      .then((user)=>{
        console.log(user);
        otpSent(user.username,user.otp);
        passport.authenticate('local')(req,res,()=>{
          res.statusCode = 200;
          res.setHeader('Content-type','application/json');
          res.json({success:true,status: "Registration Succesfull","USER":user});
        });
      },(err)=>next(err))
      .catch((err)=>next(err));
    }
  });
});

userRouter.post('/login',passport.authenticate('local'),(req,res)=>{
  var token = authenticate.getToken({_id:req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-type','application/json');
  res.json({status:"You are succesfully logged In",success:true,token:token,user:req.user});
});

userRouter.post('/verify',authenticate.verifyUser,(req,res,next)=>{
  res.statusCode = 200;
  res.setHeader('Content-type','application/json');
  Users.findById(req.user._id)
  .then((user)=>{
    if(user.otp === parseInt(req.body.otp))
    {
      user.isVerified = true;
      user.save(()=>{
        res.json({'status':'sucess'});
      })
    }
    else{
      var err = new Error('invalid OTP');
      next(err);
    }
  },(err)=>next(err))
  .catch((err)=>next(err));
  
});

userRouter.route('/test')
.get((req,res,next)=>{
  otpSent('singhbirvarinder@gmail.com','456123');
  res.statusCode=200;
  res.setHeader('Content-type','application/json');
  res.json({"status":"ok"});
});

module.exports = userRouter;
