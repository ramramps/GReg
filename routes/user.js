var UserModel = require('../lib/models').UserModel
  , error = require('../lib/error')
  , packages = require('../lib/packages')

/**
 * Lookup a user by name
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.by_name = function(req, res){

  var name = req.params.name;
  
	UserModel
	.findOne( {username: name} )
	.populate('maintains', 'name latest_version_update deprecated')
	.populate('last_updated_package', 'name latest_version_update deprecated')
	.exec(function(err, user) {

    if ( err || !user )
    {
      res.send( error.fail("There are no packages") );
      return;
    }

    var data = error.success_with_content('Found user', user);
    return res.send( data );

  });

};


/**
 * Lookup a user by id
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.by_id = function(req, res){

  var id = req.params.id;
  UserModel
	.findById( id )
	.populate('maintains', 'name latest_version_update deprecated')
	.populate('last_updated_package', 'name latest_version_update deprecated')
	.exec( function(err, user) {

    if ( err || !user )
    {
      res.send( error.fail("There are no packages") );
      return;
    }

    var data = error.success_with_content('Found user', user);
    return res.send( data );

  });

};


/**
 * Determine if a user by id, has accepted the terms of use
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.accepted_terms_of_use = function(req, res){

  var id = req.user._id;
  UserModel.findById( id, function(err, user) {

    if ( err || !user )
    {
      res.send( error.fail("User could not be found") );
      return;
    }

    var data = { user_id: user._id, accepted: user.accepted_terms_of_use };
    return res.send( error.success('Found user', data) );

  });

};


/**
 * Update acceptance of terms of use for a given user by id
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.accept_terms_of_use = function(req, res){

  var id = req.user._id;
  UserModel.findById( id, function(err, user) {

    if ( err || !user )
    {
      res.send( error.fail("User could not be found") );
      return;
    }

    try {
        user.accepted_terms_of_use = true;
        return res.send(error.success('Terms of use accepted', { user_id: user._id, accepted: true }));
    } catch (exception) {
        return console.log('Log error - could not alter acceptance');
    }

  });

};
