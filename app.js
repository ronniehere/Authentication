require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const User = require("./model/user");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

app.use(session({
    secret: "Our Secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport, passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");



app.get("/", function(req, res){
    res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res){
    res.render("login");
    
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}).then(function(results){
        if(results)
        {
            res.render("secrets", {userWithSecrets: results});
        }
    })
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})

app.get("/logout", function(req, res){
    req.logout(function(result){
        res.redirect("/");
    });
});

app.post("/register", function(req, res){
    // bcrypt.hash(req.body.password, 10, function(err, hash){
    //     if(err)
    //     {
    //         console.log(err);
    //     } else{
    //         const newUser = new User({
    //             email: req.body.username,
    //             password: hash
    //         });        
    //         newUser.save().then(function(results){
    //             if(results)
    //             {
    //                 res.render("secrets");
    //             }
    //         });
    //     }
    // });

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err)
        {
            console.log(err);
            res.redirect("/register");
        } else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/login", function(req, res){

    // User.findOne({email: req.body.username}).then(function(foundResult){
    //     if(foundResult)
    //     {
    //         bcrypt.compare(req.body.password, foundResult.password, function(err, result) {
    //             if(result === true)
    //             {
    //                 res.render("secrets");
    //             }
    //         });
    //     }
    //     else{
    //         console.log("user not found!");
    //     }
    // })

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });  

});

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    
    User.findOne({_id: req.user.id}).then(function(result){
        if(result)
        {
            result.secret=submittedSecret;
            result.save();
            res.redirect("/secrets");
        }
        else{
            console.log(err);
            res.redirect("/secrets");
        }
    })


})

app.listen(3000, function(){
    console.log("server running!");
});