var PackageModel = require('./models').PackageModel
	, PackageVersionModel = require('./models').PackageVersionModel
	, error = require('./error')
	, users = require('./users')
	, async = require('async')
	, _ = require('underscore')
	, search = require('./search');

/**
 * Validate a package version such that it is in major.minor.build format with no leading or
 * trailing white space - also allows 
 *
 * @param {string} The version string
 * @api public
 */

exports.validate_version_string = function(vers_str) {

	var re = /^(>=|>|~)?\d+\.\d+\.[\d*]+$/; 
	var result = vers_str.search(re);

	return (result === -1 ) ? false : true;

};

/**
 * Validate an engine given as a dependency. 
 *
 * @param {String} The version string
 * @api public
 */

exports.validate_engine = function(engine_name_str, vers_str) {

	return ( (engine.toLowerCase() == "dynamo" || engine.toLowerCase() == "designscript") && validate_version_string(vers_str) );

};

/**
 * Validate a license.
 *
 * @param {String} The license name
 * @api public
 */

exports.validate_license = function(license_str) {

	return license_str === "MIT"; // TODO: we should have different kinds of allowed licenses...

};

/**
 * Validate a list of dependencies to be in the right form
 *
 * @param {Array} The list of dependencies
 * @api public
 */

exports.validate_dependencies = function(dep_list) {

	for (var i = dep_list.length - 1; i >= 0; i--) {

		if ( !dep_list[i].name || typeof( dep_list[i].name ) != "string") {
			return false;
		}

		if ( !dep_list[i].version || typeof( dep_list[i].version ) != "string" 
					|| !exports.validate_version_string(dep_list[i].name) ) {
			return false;
		}

	};

	return true;

};

/**
 * Validate a list of keywords
 *
 * @param {Array} The list of dependencies
 * @returns {Object} An error object or null if it succeeds
 * @api public
 */

exports.validate_keywords = function(keyword_list) {

	if (keyword_list.length === 0)
		return null;

  var i,
      len=keyword_list.length,
      out=[],
      obj={};

  if (len > 10)
  	return error.fail('There are too many keywords.  There must be 10 or less.');

  for (i=0;i<len;i++) {

  	if ( keyword_list[i].length < 1 )
  		return error.fail('One of the keywords is too short.  Each keyword must be at least one character.');

    if ( obj[keyword_list[i]] != undefined )
    	return error.fail('There are duplicate keywords');
    else
    	obj[keyword_list[i]] = 0;
  }

  return null;

};

/**
 * Validate the basic core functionality of a package, only if they exist.  The caller is responsibile
 * for making sure the needed fields are present.
 *
 * @param {Object} The parsed json object sent from the client 
 * @param {Function} Callback to execute after look up. The argument is an error object.  If undefined 
 * @api private
 */

exports.validate_base_pkg_data = function(pkg_data) {

	if (pkg_data.name != undefined && pkg_data.name.length < 3) {
		return error.fail('The package name must be more than 3 characters.');
	}

	if (pkg_data.description != undefined && pkg_data.description.length < 3 ) {
		return error.fail('The package description given is either too short or undefined.');
	}

	if (pkg_data.keywords != undefined) {
		var key_val = exports.validate_keywords(pkg_data.keywords);
		if (key_val != undefined)
			return key_val;
	}

	if (pkg_data.version != undefined && !exports.validate_version_string(pkg_data.version) ) {
		return error.fail('Your version must be of the correct form.');
	}

	if (pkg_data.license != undefined && !exports.validate_license(pkg_data.license) ) {
		return error.fail('Your license does not seem to be supported.');
	}

	if (pkg_data.dependencies != undefined && !exports.validate_dependencies(pkg_data.dependencies) ) {
		return error.fail('Your dependencies are not in the correct form.');
	}

	return null;
}

/**
 * Looks up a list of dependencies in the database in parallel.  Assumes the list is validated.
 *
 * @param {Array} Array of name, verion pairs [name: "peter", version: "0.1.0"]
 * @param {Function} Callback to execute after look up. The argument is an error object and the list of packages.
 * @api public
 */

exports.find_dependencies_by_name_version_engine = function(dep_arr, engine, callback) {
			
	var pkg_lookups = [];
	// all of the dependencies of the new package must exist in the db
	_.each( dep_arr, function(dep) {
		pkg_lookups.push( function(inner_callback) {
			PackageModel.findOne( {name: dep.name, engine: engine }, function(err, dep_pkg) {
				if (err) {
					inner_callback(error.fail('The package called \'' + dep.name + '\' does not exist'));
					return;
				}
				// check the version exists
				for (var i = 0; i < dep_pkg.versions.length; i++) {
					if ( dep.version === dep_pkg.versions[i].version) {
						inner_callback(null, dep_pkg);
						break;
					}
				}
				inner_callback( error.fail('The package version \'' + dep.version + '\' of package \'' + dep.name + '\' does not exist'));
			}); // find one
		}); // push func
	}); // each

	// run all of these lookups in parallel, callback is executed if any of them fails
	async.parallel( pkg_lookups, callback );

}  

/**
 * Validate new package version data from a user.  This validation is required to insert into db.
 * This is async as it may require a database lookup.  If successful, this function has the side effect
 * of attaching pkg_data.user_id and pkg_data.pkg_id for later use.
 *
 * @param {Object} The parsed json object sent from the client (typically via a REST call)
 * @param {Function} Callback to execute after look up. The argument is an error object.  If undefined 
 * @api private
 */

function _validate_new_pkg_version(req, pkg_data, callback) {

	console.log('Calling validate on new package version...');

	if ( !req || !req.user ) {
		callback( error.fail('There must be a name associated with a package update.') );
		return;
	}

	if (!pkg_data.version) {
		callback( error.fail('You must supply the package version.') );
		return;
	}

	if (!pkg_data.engine) {
		callback( error.fail('You must supply the engine.') );
		return;
	}

	if (!pkg_data.pkg_id) {
		callback( error.fail('You must supply the package id for the version.') );
		return;
	}

	var valid_pkg_data = exports.validate_base_pkg_data(req, pkg_data );
	if ( valid_pkg_data ) {
		callback(valid_pkg_data);
		return;
	}

	// waterfall runs functions in series, passing results to the next function
	// if any function returns error object, the whole thing terminates
	async.waterfall([ 
		
		// assert: the user making the change exists in db
		function(outer_callback) {
			users.get_user_by_name(req.user.username, function(err, user) {
				if (err) {
					outer_callback(error.fail('Failed to look up the username'));
					return;
				}
				pkg_data.user_id = user._id;
				outer_callback(null, user); // user var is passed to the next func
			});
		},
		// assert: the package receiving the new version is in db
		function(user, outer_callback) {
			PackageModel.findOne({name: pkg_data.name, engine: pkg_data.engine}, function(err, pkg) {
				if (err) {
					outer_callback( error.fail('The package does not exist in the database.'));
					return;
				}
				pkg_data.pkg_id = pkg._id; // attach the pkg_id to pkg_data
				outer_callback(null, user, pkg);
			});
		},
		// assert: the user making the change is a current maintainer of this package
		function(user, pkg, outer_callback) {
			var user_is_maintainer = false;
			for (var i = user.maintains.length - 1; i >= 0; i--) {
				if ( user.maintains[i] == pkg._id ){
					user_is_maintainer = true;
					break;					
				}
			}
			if (!user_is_maintainer){
				callback( error.fail('The user sending the new package version is not a maintainer of that package.') );
				return;
			}
			outer_callback(null, user, pkg);
		},
		// assert: all of the maintainers of the software must exist in the db
		function(user, pkg, outer_callback) {
				users.find_users_by_name(pkg_data.maintainers, outer_callback); // outer_callback is called with (error, users)
		},
		// attach all of the maintainer ids to pkg_data
		function(users, outer_callback) {
			pkg_data.maintainer_ids = [];
			_.each(users, function(user) {
				pkg_data.maintainer_ids.push(user._id);
			});
			outer_callback(null, users);
		},
		// assert: all of the dependencies of the new package must exist in the db
		function(users, outer_callback) {
			exports.find_dependencies_by_name_version_engine(pkg_data.dependencies, pkg_data.engine, function(err, deps) {
				if (err) { // some or one of the dependencies does not exist in the db
					outer_callback(err);	
					return;
				}
				// attach all of the dependencies to the pkg_data
				pkg_data.dependency_ids = [];
				_.each(deps, function(dep) {	
					pkg_data.dependency_ids.push(dep._id);
				});
			});
		}
	], function(err) { // closing waterfall 

		if (err) {
				if (callback) callback(err);
				return;
			}
		// DB: everything is good, pipe data to amazon
		callback();

	});

};

/**
 * Validate new package data from a user.  This validation is required to insert into db.
 * This is async as it may require a database lookup.  The function must determine if the user
 * is validated to insert into the db and that all of the data looks fine.
 *
 * @param {Object} The request object
 * @param {Object} The parsed json object sent from the client (typically via a REST call)
 * @param {Function} Callback to execute after look up. Argument is an error object.
 * @api private
 */

function _validate_new_pkg(req, pkg_data, callback) {

	console.log('Calling validate on new package...');
	console.log(pkg_data);

	if (!req || !req.user) {
		callback( error.fail('There must be a name associated with a package update.') );
		return;
	}

	if (!pkg_data.name) {
		callback( error.fail('You must supply the package name.') );
		return;
	}

	if (!pkg_data.version) {
		callback( error.fail('You must supply the package version.') );
		return;
	}

	if (!pkg_data.description) {
		callback( error.fail('You must supply the package description.') );
		return;
	}

	if (!pkg_data.license) {
		callback( error.fail('You must supply a license.') );
		return;
	}

	if (!pkg_data.engine) {
		callback( error.fail('You must supply an engine.') );
		return;
	}

	if (!pkg_data.engine_version) {
		callback( error.fail('You must supply an engine_version.') );
		return;
	}

	var valid_pkg_data = exports.validate_base_pkg_data(req, pkg_data );
	if ( valid_pkg_data ) {
		callback(valid_pkg_data);
		return;
	}

	console.log('basic validations complete of new pkg');

	// waterfall runs functions in series, passing results to the next function
	// if any function returns error object, the whole thing terminates
	async.waterfall([ 
		// assert: the user making the change exists in db
		function(outer_callback) {
			users.get_user_by_name(req.user.username, function(err, user) {
				if (err) {
					outer_callback(error.fail('Failed to look up the username'));
					return;
				}
				pkg_data.user_id = user._id;
				outer_callback(null, user); // user var is passed to the next func
				console.log('validated user name')
			});
		},
		// assert: the package with the given name and engine must not already exist in the db
		function(user, outer_callback) {
			PackageModel.findOne({name: pkg_data.name, engine: pkg_data.engine }, function(err, pkg) {
				if (err != undefined) {
					outer_callback( error.fail('A package with the given name and engine exists.') );
					return;
				}
				outer_callback(null, user, pkg);
				console.log('validated package and engine dont already exist');
			});
		}, 
		// assert: all of the maintainers of the software must exist in the db
		function(user, pkg, outer_callback) {
			users.find_users_by_name(pkg_data.maintainers, outer_callback); // outer_callback is called with (error, users)
			console.log('looked for maintainers');
		},
		// attach all of the maintainer ids to pkg_data
		function(users, outer_callback) {
			pkg_data.maintainer_ids = [];
			_.each(users, function(user) {
				pkg_data.maintainer_ids.push(user._id);
			});
			outer_callback(null, users);
			console.log('attached maintainer ids');
		},
		// assert: all of the dependencies of the new package must exist in the db
		function(users, outer_callback) {
			exports.find_dependencies_by_name_version_engine(pkg_data.dependencies, pkg_data.engine, function(err, deps) {
				if (err) { // some or one of the dependencies does not exist in the db
					outer_callback(err);	
					return;
				}
				// attach all of the dependencies to the pkg_data
				pkg_data.dependency_ids = [];
				_.each(deps, function(dep) {	
					pkg_data.dependency_ids.push(dep._id);
				});
				outer_callback(null);
				console.log('making sure all deps exist');
			});
		}
	// closing waterfall
	], function(err) {

		if (err) {
				if (callback) callback(err);
				return;
			}

			console.log('waterfall complete');
		// TODO: everything is good, pipe data to amazon
		callback();
	});
}

/**
 * Validate and, if successful, save newly created package into the db
 *
 * @param {Object} The request object (which holds the user data)
 * @param {Object} The parsed and validated json from the client.
 * @param {Function} Callback to execute after inserting. The argument is always an error object 
 * indicating success or failure
 * @api public
 */

exports.save_new_pkg = function(req, pkg_data, callback) {

	_validate_new_pkg(req, pkg_data, function(err) {

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

exports.save_new_pkg_version = function(req, pkg_vers_data, callback) {

	_validate_new_pkg_version(req, pkg_vers_data, function(err) {

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
	  , dependencies: pkg_data.dependency_ids
	  , license: pkg_data.license
	  , contents: pkg_data.url

	});

	pkg.versions = [{version: pkg_data.version, id: pkg_v._id }];

	async.series([
		// save the package version
		function(inner_callback){
			pkg_v.save( function(err){  
		    if (err) {
		      inner_callback( error.fail('DB error creating new package version. Cleaning up.') );
		      return;
		    }
		    inner_callback(null);
		  });
		},
		// save the package
		function(inner_callback){
			pkg.save( function(err){  
		    if (err) {
		      _delete_pkg_version(pkg_v._id, function() {
						inner_callback( error.fail( 'DB error creating new package') );
		      });	
		      return;
		    }
		    inner_callback(null);
		  });
		},
		// update the user's data
		function(inner_callback){
			users.update_user_maintains(pkg._id, pkg_data.user_id, function(err) {
	    	if (err) {
	    		inner_callback( error.fail( 'Successfully inserted the package in the db, but failed to update user') );
	    	}
 				inner_callback( null );
	    });
		},
		// update search  TODO: this is really a stub - what needs to be updated?  what is indexed?      
		function(inner_callback){
			search.add(pkg, inner_callback);
		},
		// tell all of the dependencies about the package that depends on them in pkg_data.dependency_ids
		function(inner_callback){
			if (pkg_data.dependency_ids != undefined && pkg_data.dependency_ids.length > 0 )
				exports.update_pkg_list_used_by( pkg, pkg_data.dependency_ids, inner_callback );
			else
				inner_callback(null);
		},
		// tell all the maintainers that about the package they maintain in pkg_data.maintainer_ids, remove the maintainers that no longer do
		function(inner_callback){
			if (pkg_data.maintainer_ids != undefined && pkg_data.maintainer_ids.length > 0 )
				users.update_user_list_maintains( pkg, pkg_data.maintainer_ids, inner_callback );
			else
				inner_callback(null);
		}
	], function(err, data) { // final callback for series
		if (err) {
			if (callback) callback(err);
			return;
		}
		if (callback) callback( error.success( 'Successfully inserted the package in the db') );
	});

	// TODO: need to roll back all of the changes when you fail to save data

};

/**
 * Updates a packages used_by field with a package. Doesn't create duplicates.
 *
 * @param {Object} The dependent pkg
 * @param {Object} The depended on pkg
 * @param {Function} Callback to execute after inserting. The argument is an error object.
 * @api private
 */

exports.update_pkg_used_by = function(dependent_pkg_id, pkg_id, callback) {

	PackageModel.findById(pkg_id, function(err, pkg) {
		if (err) {
			callback(error.fail('The dependency does not exist'));
			return;
		};

		if (pkg.used_by.indexOf(dependent_pkg_id) === -1) {
			pkg.used_by.push( dependent_pkg_id );
			pkg.markModified('used_by');
			pkg.save();
		}

		callback(null, pkg);
	});

};

/**
 * Updates the used_by field of a list of packages with a dependent package id in parallel. Doesn't create duplicates.
 *
 * @param {Object} The dependent pkg
 * @param {Array} The list of depended on pkgs
 * @param {Function} Callback to execute after inserting. The argument is an error object if any of the package updates failed.
 * @api public
 */

exports.update_pkg_list_used_by = function(dependent_pkg_id, pkg_id_list, callback) {

	var funcs = [];

	// build up list of work to do
	_.each(pkg_id_list, function(pkg_id) {
		funcs.push(function(inner_callback) {
			exports.update_pkg_used_by(dependent_pkg_id, pkg_id, inner_callback);
		});
	});

	async.parallel(funcs, function(err, pkgs) {
		if (err) {
			callback(error.fail('Failed to update the used_by fields of a package. '))
		}
		callback(null, pkgs);
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

	var pkg_v = new PackageVersionModel( {

	  package: pkg_version.pkg_id
	  , version: pkg_data.version
	  , uses: pkg_data.uses
	  , engine: pkg_data.engine
	  , engine_version: pkg_data.engine_version
	  , engine_metadata: pkg_data.engine_metadata
	  , dependencies: pkg_data.dependency_ids
	  , license: pkg_data.license
	  , contents: pkg_data.url

	});

	async.series([
		// save the package version
		function(inner_callback){
			pkg_v.save( function(err){  
		    if (err) {
		      inner_callback( error.fail('DB error creating new package version. Cleaning up.') );
		      return;
		    }
		    inner_callback(null);
		  });
		},
		// update the package itself
		function(inner_callback){
	   PackageModel.findById(pkg.pkg_id, function(err, pkg) {

	   		if (err) {
					inner_callback(error.fail('Could not find package when updating it with new version.'));
					return;
	   		}

	    	pkg.versions.push({version: pkg.version, id: pkg_v._id });
	    	pkg.markModified('versions');

	    	if (pkg_data.description != undefined) {
		    	pkg.description = pkg_data.description;
		    	pkg.markModified('description');
	    	}

	    	if (pkg_data.maintainer_ids != undefined ) {
		    	pkg.maintainers = pk_data.maintainer_ids;
		    	pkg.markModified('maintainers');
	    	}

	    	if (pkg_data.keywords != undefined ) {
		    	pkg.keywords = pk_data.keywords;
		    	pkg.markModified('keywords');
	    	}

	    	pkg.save(function(err) {
	    		if (err) {
	    			inner_callback(error.fail('Failed to update save the changes to the package when creating new version.'))
	    		}
	    		inner_callback(null);
	    	});
	    	
	    });
		},
		// update search  TODO: this is really a stub - what needs to be updated?  what is indexed?      
		function(inner_callback){
			search.add(pkg, inner_callback);
		},
		// tell all of the dependencies about the package that depends on them in pkg_data.dependency_ids
		function(inner_callback){
			if (pkg_data.dependency_ids != undefined && pkg_data.dependency_ids.length > 0 )
				exports.update_pkg_list_used_by( pkg, pkg_data.dependency_ids, inner_callback );
			else
				inner_callback(null);
		},
		// tell all the maintainers that about the package they maintain in pkg_data.maintainer_ids, remove the maintainers that no longer do
		function(inner_callback){
			if (pkg_data.maintainer_ids != undefined && pkg_data.maintainer_ids.length > 0 )
				users.update_user_list_maintains( pkg, pkg_data.maintainer_ids, inner_callback );
			else
				inner_callback(null);
		}
		], function(err, data) { // final callback for series
		if (err) {
			if (callback) callback(err);
			return;
		}
		if (callback) callback( error.success( 'Successfully inserted the package in the db') );
	});

	// TODO: remove the dependencies that are no longer such
	// TODO: remove the maintainers that no longer do
	// TODO: need to roll back all of the changes when you fail to save data

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



