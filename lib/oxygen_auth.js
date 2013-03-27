var passport = require('passport')
  , UserModel = require('./models').UserModel
  , util = require('util')
  , request = require('superagent');


/**
 * Constructor for the oxygen authentication strategy
 *
 * @param {Object} options
  * @param {Object} options
 * @api protected
 */

function Strategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  
  passport.Strategy.call(this);
  this.name = 'oxygen';
  this._verify = verify;
  this.validation_url = 'http://accounts-dev.autodesk.com/api/oauth/v1/validateAuthorization';
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Ask Oxygen to verify an authorization header.
 *
 * @param {Object} req
 * @api protected
 */

Strategy.prototype.authenticate = function(req, options) {

  options = options || {};

  if (req.headers.authorization === null ) {
    return this.fail( new BadRequestError(options.badRequestMessage || 'Missing credentials') );
  }

  var self = this;

  function verified(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }
    console.log('Verified user');
    self.success(user, info);
  }

  try {

    request
      .post(self.validation_url)
      .type('form')
      .send({authorizationHeader:req.headers.authorization})
      .send({requestUrl: 'http://' + req.headers.host + req.url })
      .send({httpMethod: req.method})
      .send({responseFormat:'json'})
      .set('Accept', 'application/json')
      .end(function(error, res2){
        if (error){
         return self.fail( new BadRequestError(options.badRequestMessage || 'Invalid credentials') );
        } else {
          try {
            var user_data = JSON.parse( res2.text );  
            self._verify(req, user_data, verified);
          } catch (e) {
            return self.fail( new BadRequestError(options.badRequestMessage || 'Invalid authentication response') );
          }
        }
      });

  } catch (e) {
    return self.fail( new BadRequestError(options.badRequestMessage || 'Failed to authenticate') );
  }

}

/**
 * `BadRequestError` error.
 *
 * @api public
 */
function BadRequestError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'BadRequestError';
  this.message = message || null;
};

// Inherit from error
BadRequestError.prototype.__proto__ = Error.prototype;


// Expose Strategy
module.exports = Strategy;


// Sign up the oxygen strategy with passport
passport.use(new Strategy( 

  function(req, user_data, done) {

    console.log(user_data);

    UserModel.findOne({ username: user_data.TokenValidationResult.UserName }, function (err, user) {

      // create a new user, as they don't currently exist in the db
      if (err || !user) {
      // try {

        var result = user_data.TokenValidationResult;

        var new_user_data = {
          oxygen_id: result.User.Id,
          eidm_guid: result.User.EidmGuid,
          username: result.User.UserName,
          email: result.User.Email,
          first_name: result.User.Profile.FirstName,
          last_name: result.User.Profile.LastName,
          country_code: result.User.Profile.CountryCode,
          language: result.User.Profile.Language
        };

        var new_user = new UserModel(new_user_data);

        console.log(new_user);

        new_user.save( function(err) {
          if (err) {
            console.log("CAN'T save");
            return done( err );
          }
          return done(null, new_user );
        });

      // } catch (e) {
      //   // bad stuff happened
      // }

      } else {
        // everything's good :D
        return done(null, user);
      }
    
    }); 
  }

));
