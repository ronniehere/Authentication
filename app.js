require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const User = require("./model/user");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

mongoose.connect("mongodb://127.0.0.1:27017/userDB");


app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
    
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save().then(function(results){
        if(results)
        {
            res.render("secrets");
        }
    });

});

app.post("/login", function(req, res){

    User.findOne({email: req.body.username}).then(function(foundResult){
        if(foundResult)
        {
            if(foundResult.password === req.body.password)
            {
                res.render("secrets");
            }
        }
        else{
            console.log("user not found!");
        }
    })

});



app.listen(3000, function(){
    console.log("server running!");
});