const mongoose = require('mongoose');
const plm = require("passport-local-mongoose"); //  it will hash password for us so we don't need to handle it externally

mongoose.connect("mongodb://127.0.0.1:27017/instaclone");

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileImage: String,
  bio: String,
  posts: [{type: mongoose.Schema.Types.ObjectId, ref: "post"}],
})

userSchema.plugin(plm); // providing serialize user or deserialize user

module.exports = mongoose.model("user", userSchema);