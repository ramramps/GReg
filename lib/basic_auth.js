var passport = require('passport')
  , BasicStrategy = require('passport-http').BasicStrategy
  , UserModel = require('./models/user').UserModel;

////////////////////////
// Passport
////////////////////////

  passport.use(new BasicStrategy(

    function(username, password, done) {

      UserModel.findOne({ username: username }, function (err, user) {
        
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user);

      });
      
    }

  ));