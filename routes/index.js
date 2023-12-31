var express = require('express');
var router = express.Router();

const userModel = require('./users');
const postModel = require('./post');
const passport = require('passport');
const upload = require('./multer');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const fs = require('fs');

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  if (req.isAuthenticated()) return res.redirect('/profile');
  res.render('login', {footer: false});
});

router.get('/feed', isLoggedIn, async function (req, res) {
  const posts = (await postModel.find().populate("user")).reverse();
  res.render('feed', { footer: true, posts });
});

router.get('/profile', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render('profile', { footer: true, user });
});

router.get('/search', isLoggedIn, function(req, res) {
  res.render('search', {footer: true});
});

router.get('/edit', isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('edit', { footer: true, user });
});

router.get('/upload', isLoggedIn, function (req, res) {
  res.render('upload', { footer: true });
});

router.post("/register", function(req, res, next) {
  const {username, name, email, profileImage, password} = req.body;
  const userData = new userModel({
    username: username,
    name: name,
    email: email,
    profileImage: profileImage,
  });

  userModel.register(userData, password)
  .then(function() {
    passport.authenticate("local")(req, res, function() {
      res.redirect("/profile");
    })
  })
})

router.post('/login',passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login"
}), function (req, res) {

});

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

router.post('/update', upload.single("image"), async function(req, res) {
  const {username, name, bio} = req.body;
  const user = await userModel.findOneAndUpdate({username: req.session.passport.user}, 
      {username,name,bio}, {new: true});

  if(user.profileImage) {
    removePrevImage(user.profileImage);
  }
  if (req.file?.filename) user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');
})

router.post('/upload', isLoggedIn, upload.single("image"), async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    picture: req.file.filename,
    user: user._id,
    caption: req.body.caption
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect('/feed');
})


function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

function removePrevImage(name) {
  const filePath = `./public/images/uploads/${name}`;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return;
    }
    console.log('File deleted successfully');
  });
}

module.exports = router;
