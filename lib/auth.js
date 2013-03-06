var passport = require('passport')
  , BasicStrategy = require('passport-http').BasicStrategy
  , UserModel = require('./models').UserModel;

////////////////////////
// Passport
////////////////////////

  passport.use(new BasicStrategy(

    function(username, password, done) {

      UserModel.findOne({ username: username }, function (err, user) {
        console.log('authorizing user');
        
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        // if (!user.validPassword(password)) { return done(null, false); }
        return done(null, user);
      });

    }

  ));