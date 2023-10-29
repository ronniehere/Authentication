const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const findOrCreatePlugin = require("mongoose-findorcreate");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreatePlugin);
module.exports = mongoose.model("User", userSchema);