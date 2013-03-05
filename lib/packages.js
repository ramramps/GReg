var PackageModel = require('./models').PackageModel
	, PackageVersionModel = require('./models').PackageVersionModel
	, error = require('./error');

/**
 * Validate new package data from a user.  This validation is required to insert into db.
 * This is async as it may require a database lookup.  The function must determine if the user
 * is validated to insert into the db and that all of the data looks fine.
 *
 * @param {Object} The parsed json object sent from the client (typically via a REST call)
 * @param {Function} Callback to execute after look up. Argument is an error object.
 * @api private
 */

function _validate_new_pkg(pkg_data, callback) {

	console.log('Calling validate on new package');
	if (callback) callback(); // callback with nothing, indicating success

};

/**
 * Validate new package version data from a user.  This validation is required to insert into db.
 * This is async as it may require a database lookup
 *
 * @param {Object} The parsed json object sent from the client (typically via a REST call)
 * @param {Function} Callback to execute after look up. The argument is an error object.  If undefined 
 * @api private
 */

function _validate_new_pkg_version(pkg_data, callback) {

	console.log('Calling validate on new package version')
	if (callback) callback(); // callback with nothing, indicating success

};

/**
 * Validate and, if successful, save newly created package into the db
 *
 * @param {Object} The parsed and validated json from the client.
 * @param {Function} Callback to execute after inserting. The argument is always an error object 
 * indicating success or failure
 * @api public
 */

exports.save_new_pkg = function(pkg_data, callback) {

	_validate_new_pkg(pkg_data, function(err) {

		if (err) {
			if (callback) callback(err);
			return;
		}

		_save_new_pkg( pkg_data, callback );

	});
}


/**
 * Validate and, if successful, save new package version into the db.
 *
 * @param {Object} The parsed and validated json from the client.
 * @param {Function} Callback to execute after inserting. The argument is always an error object 
 * indicating success or failure
 * @api public
 */

exports.save_new_pkg_version = function(pkg_vers_data, callback) {

	_validate_new_pkg_version(pkg_data, function(err) {

		if (err) {
			if (callback) callback(err);
			return;
		}

		_save_new_pkg_version( pkg_vers_data, callback );

	});

}

/**
 * Save a new package, along with its first version, into the db, assuming pkg_data has 
 * been validated and the user is authorized to insert into db.
 *
 * @param {Object} The parsed and validated json from the client.
 * @param {Function} Callback to execute after inserting. The argument is an error object.
 * @api private
 */

function _save_new_pkg (pkg_data, callback) {

	var pkg = new PackageModel({
		name: pkg_data.name
		, description: pkg_data.description
	  , keywords: pkg_data.keywords
	  , maintainers: [pkg_data.user_id]
	});

	var pkg_v = new PackageVersionModel( {

	  package: pkg._id
	  , version: pkg_data.version
	  , uses: pkg_data.uses
	  , engine: pkg_data.engine
	  , engine_version: pkg_data.engine_version
	  , engine_metadata: pkg_data.engine_metadata
	  , license: pkg_data.license
	  , contents: pkg_data.url

	});

	pkg.versions = [{version: pkg_data.version, id: pkg_v._id }];

	console.log( 'saving pkg:', pkg );
	console.log( 'saving pkg_v:', pkg_v );

	// save the pkg_v
  pkg_v.save( function(err){  

    if (err)
    {
      if (callback) callback( error.fail('DB error creating new package version') );
      return;
    }

    // save the pkg
  	pkg.save( function(err){  

	    if (err)
	    {
	      // cleanup
	      _delete_pkg_version(pkg_v._id, function() {
					if (callback) callback( error.fail( 'DB error creating new package') );
	      });	
	      return;
	    }

	    if (callback) callback( error.success( 'Successfully inserted the package in the db') );

	    // TODO: add the package to search, update the user's profile, mark dependencies

	  });
  });

};


/**
 * Save a new package version into the db and updates package.  It is assumed that the pkg_vers_data is 
 * already validated and the user is authenticated and a maintainer of the package.
 *
 * @param {Object} The parsed and validated json from the client.
 * @param {Function} Callback to execute after inserting. The argument is an error object.
 * @api private
 */

function _save_new_pkg_version(pkg_vers_data, callback) {

	var pkg_v = new PackageVersion( {

	  package: pkg.pkg_id
	  , version: pkg_data.version
	  , uses: pkg_data.uses
	  , engine: pkg_data.engine
	  , engine_version: pkg_data.engine_version
	  , engine_metadata: pkg_data.engine_metadata
	  , license: pkg_data.license
	  , contents: pkg_data.url

	});

	pkg_v.save( function(err){  

    if (err)
    {
      if (callback) callback( error.fail('DB error creating new package version') );
      return;
    }

    PackageModel.findById(pkg.pkg_id, function(err, pkg) {

    	pkg.versions.push({version: pkg.version, id: pkg_v._id });
    	pkg.markModified('versions');
    	pkg.save();

    });

	});
};

/**
 * Delete a specific package version from the database.  Assumes the client has the right to do this.
 *
 * @param {ObjectId} The id of the pkg version
 * @param {Function} Callback to execute after inserting. The argument is an error object.
 * @api public
 */

exports.delete_pkg_version = function(pkg_version_id, callback) {

	// TODO: need extra validation step

	_delete_pkg_version(pkg_version_id, function(err, pkg_version) {

		if (err) {
			callback(err);
			return;
		}

		_delete_pkg_version_reference_in_pkg(pkg_version.package, pkg_version_id, function(err) 
		{
			if (err) {
				callback(err);
				return;
			}

			callback( error.success('Successfully removed pkg version from database.') );

		});

	});

};

/**
 * Delete a reference to a package version in a package
 *
 * @param {ObjectId} The id of the pkg version
 * @param {Function} Callback to execute after inserting. The argument is an error object.
 * @api private
 */

function _delete_pkg_version_reference_in_pkg(pkg_id, pkg_version_id, callback) {
	
	PackageModel.findById( pkg_id, function(err, pkg) {

		if (err) {
	  	if (callback) callback( error.fail('Failed to find the package version to delete in the db') )
	  	return;
		}	

    for (var i = 0; i < pkg.versions.length; i++ )
    {
      if ( pkg.versions[i].id == pkg_version_id )
      {
        pkg.containedBy.splice(i,1);
        pkg.markModified('containedBy');
        pkg.save();
        callback(null, pkg);
        break;
      }
    }

    callback(error.fail('Failed to find package version amongst package versions for package.'));

	}); 

};

/**
 * Delete a package and all its versions from the database.
 *
 * @param {ObjectId} The id of the pkg
 * @param {Function} Callback to execute after inserting. The argument is an error object.
 * @api public
 */

exports.delete_pkg = function(pkg_id, callback) {

	// TODO: extra validation

	_delete_pkg(pkg_id, function(err, pkg) {
		
		if (err) {
			callback(err);
			return;
		}

		_delete_pkg_versions(pkg.versions, function(err) {

			if (err) {
				callback(err);
				return;
			}

			callback(error.success('Successfully removed package from database.'))

		});

	})

};


/**
 * Delete a package, but not it's versions (that is handled by _delete_pkg_versions)
 *
 * @param {ObjectId} The id of the pkg
 * @param {Function} Callback to execute after inserting. The arguments are an error object (null if successful) and the deleted pkg.
 * @api private
 */

function _delete_pkg(pkg_id, callback) {

	PackageModel.findById( pkg_id , function(err, pkg) {

		if (err) {
	  	if (callback) callback( error.fail('Failed to find the package version to delete in the db') )
	  	return;
		}

		pkg.remove(function (err, pkg) {

		  if (err) {
		  	if (callback) callback( error.fail('Failed to remove the pkg version from the database') )
		  	return;
		  }

		  if (callback) callback(null, pkg)

		});

	}); 

};

/**
 * Delete a package, but not it's reference in the package (handled by _delete_pkg_version_reference_in_pkg)
 *
 * @param {ObjectId} The id of the pkg
 * @param {Function} Callback to execute after inserting. The arguments are an error object (null if successful) and the deleted obj.
 * @api private
 */

function _delete_pkg_version(pkg_id, callback) {

	PackageVersionModel.findById( pkg_id , function(err, pkg) {

		if (err) {
	  	if (callback) callback( error.fail('Failed to find the package version to delete in the db') )
	  	return;
		}

		pkg.remove(function (err, pkg) {

		  if (err) {
		  	if (callback) callback( error.fail('Failed to remove the pkg version from the database') )
		  	return;
		  }

		  if (callback) callback(null, pkg)

		});

	}); 

};

/**
 * Delete an array of packages, but doesn't update the package itself
 *
 * @param {Array} An array of objects as stored with a PackageModel ({version: string, id: ObjectId})
 * @param {Function} Callback to execute after inserting. The arguments are an error object (null if successful) and the deleted obj.
 * @api private
 */

function _delete_pkg_versions(versions, callback) {

  _.each( versions, function( elem ) {
  	// TODO: chained promises so that there is only one callback
  	_delete_pkg_version(elem.id, callback);

  });

};




