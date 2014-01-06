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
