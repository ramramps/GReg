var PackageModel = require('./models').PackageModel
	, error = require('./error')
	, users = require('./users')
	, async = require('async')
	, _ = require('underscore')
	, search = require('./search')
	, mongoose = require('mongoose');


/**
 * Finds all the dependencies of a package
 *
 * @param {string} The version string
 * @api public
 */

exports.find_all_deps = function( pkg_id, version, callback, d ) {

	// initialize the dictionary at start
	if (d === undefined) {
		d = {};
	}

	// if we've already discovered this dependency, callback with no error
	if ( d[ pkg_id ] && d[ pkg_id ][version] != undefined){
		callback(null, d);
		return;
	}

	PackageModel.findById(pkg_id, function(err, pkg) {

		if (err){
			callback(error.fail('One of the dependencies did not exist'));
			return;
		}

		var index = -1;

		// look up the pkg version (TODO: this needs to be smarter to support >= and * notation)
		for (var i = 0; i < pkg.versions.length; i++) {
			if (pkg.versions[i].version === version){
				index = i;
				break;
			}
		};

		// if the version does not exist, tell about the error
		if (index === -1){
			callback( error.fail('The package version does not exist.') );
			return;
		}

		var pkg_version = JSON.parse( JSON.stringify( pkg.versions[index] ) );

		// save this package and version to the dictionary
		if (d[ pkg_id ] === undefined)
			d[ pkg_id ]= {};

		d[ pkg_id ][ version ] = pkg_version;
		d[ pkg_id ][ version ].name = pkg.name;

		// if this pkg has no direct dependencies, skip town
		if (pkg_version.direct_dependency_ids === undefined || pkg_version.direct_dependency_ids.length === 0){
			callback(null, d);
			return;
		}

		// otherwise, lets lookup all of the deps recursively
		var pkg_lookups = [];

		for (var i = 0; i < pkg_version.direct_dependency_ids.length; i++){

			( function(id, vers, lookups) {
				pkg_lookups.push( function(inner_callback) {
					exports.find_all_deps(id, vers, inner_callback, d);
				});
			})( pkg_version.direct_dependency_ids[i], pkg_version.direct_dependency_versions[i] );

		}

		// run this function
		async.parallel(pkg_lookups, function(err) {
			if (err) {
				callback(err);
				return;
			}
			callback(null, d);
		});

	});
};

/**
 * Obtain a list of packages given a list of ids
 *
 * @param {Array} A list of ids
 * @api public
 */

exports.get_pkg_list = function(pkg_ids, callback ) {

	var pkg_lookups = [];

	// Set up all of the pkg lookups
	_.each(pkg_ids, function(pkg_id) {
		pkg_lookups.push( function(inner_callback) {
			PackageModel.findById(pkg_id, 'name keywords engine group', function(err, pkg) {
				if (err) {
					inner_callback(error.fail('Couldnt find one of the packages.'));
					return;
				}
				inner_callback(null, pkg);
			});
		});
	});

	// Execute all lookups in parallel and then return them
	async.series( pkg_lookups, function( err, data ) {
		if (err) {
			callback(err);
			return;
		}
		callback( null, data );
	});

};


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
				
				if ( err || !dep_pkg ) {
					inner_callback(error.fail('The package called \'' + dep.name + '\' with engine ' + engine+ ' does not exist'));
					return;
				}

				if (dep_pkg.versions === undefined) {
					inner_callback(error.fail('The package has no valid versions'));
					return;
				}

				// check the version exists
				for (var i = 0; i < dep_pkg.versions.length; i++) {
					if ( dep.version === dep_pkg.versions[i].version ) {
						inner_callback(null, {version: dep.version, id: dep_pkg._id} );
						return;
					}
				}

				inner_callback( error.fail('The package version \'' + dep.version + '\' of package \'' + dep.name + '\' does not exist') );

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

	if ( !req || !req.user ) {
		callback( error.fail('There must be a name associated with a package update.') );
		return;
	}

	var valid_fields_err = exports.validate_fields_are_present('name version contents engine', pkg_data);
	if ( valid_fields_err ){
		callback( valid_fields_err );
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
				if (err || !user) {
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
				if (err || !pkg) {
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
			for (var i = 0; i < user.maintains.length; i++) {
				if ( pkg._id.equals( user.maintains[i] ) ){
					user_is_maintainer = true;
					break;					
				}
			}
			if ( !user_is_maintainer ){
				outer_callback( error.fail('The user sending the new package version, '+ user.username + ', is not a maintainer of the package ' + pkg.name + pkg._id + user.maintains) );
				return;
			}
			outer_callback(null, user, pkg);
		},
		// assert: all of the maintainers of the software must exist in the db
		function(user, pkg, outer_callback) {

			if (pkg_data.maintainers != undefined && pkg_data.maintainers.length != 0) {
				users.find_users_by_name(pkg_data.maintainers, outer_callback); // outer_callback is called with (error, users)
				return;
			}
			outer_callback( null, null );
			
		},
		// attach all of the maintainer ids to pkg_data
		function(users, outer_callback) {

			if ( typeof variable_here === 'undefined' || users.length === 0 ) {
				outer_callback(null, null);
				return;
			}

			pkg_data.maintainer_ids = [];
			_.each(users, function(user) {
				pkg_data.maintainer_ids.push(user._id);
			});

			outer_callback(null, users);
		},
		// assert: all of the dependencies of the new package must exist in the db
		function(users, outer_callback) {

			exports.find_dependencies_by_name_version_engine(pkg_data.dependencies, pkg_data.engine, function(err, deps) {

				if (err) { // one of the dependencies isn't present
					outer_callback(err);	
					return;
				}

				var ids = [];
				var versions = [];

				_.each(deps, function(dep) {
					ids.push(dep.id);
					versions.push(dep.version);
				});

				pkg_data.direct_dependency_versions = versions;
				pkg_data.direct_dependency_ids = ids;

				outer_callback(null, deps);
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
 * @api public
 */

exports.validate_fields_are_present = function(fields, pkg_data, callback) {

	var fields_split = fields.split(' ')
		, field_name = "";

 	for (var i = 0; i < fields_split.length; i++) {
 		field_name = fields_split[i];
 		if (pkg_data[field_name] === undefined) {
 			return error.fail('Field ' + field_name + ' must be defined.')
 		}
 	}

 	return null;
 }

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

	if (!req || !req.user) {
		callback( error.fail('There must be a name associated with a package update.') );
		return;
	}

	var valid_fields_err = exports.validate_fields_are_present('name contents version description license engine engine_version', pkg_data);
	if ( valid_fields_err ){
		callback( valid_fields_err );
		return;
	}

	var valid_pkg_err = exports.validate_base_pkg_data(req, pkg_data );
	if ( valid_pkg_err ) {
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
		// assert: the package with the given name and engine must not already exist in the db
		function(user, outer_callback) {
			PackageModel.findOne({name: pkg_data.name, engine: pkg_data.engine }, function(err, pkg) {
				if (pkg != undefined) {
					outer_callback( error.fail('A package with the given name and engine exists.') );
					return;
				}
				outer_callback(null, user, pkg);
			});
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
				var ids = [];
				var versions = [];

				_.each(deps, function(dep) {
					ids.push(dep.id);
					versions.push(dep.version);
				});

				pkg_data.direct_dependency_versions = versions;
				pkg_data.direct_dependency_ids = ids;

				outer_callback(null, deps);
			});
		}
	// closing waterfall
	], function(err) {
		if (err) {
				if (callback) callback(err);
				return;
			}
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
 * Get package search object.  Basically just simplifies creating this object.
 *
 * @param {Object} The PackageModel object
 * @returns {Object} The package search object
 * @api public
 */

exports.get_pkg_search_object = function(pkg) {

	var pkg_search_obj = {};

	if (pkg.name)
		pkg_search_obj.name = pkg.name;

	if (pkg.keywords)
		pkg_search_obj.keywords = pkg.keywords;

	if (pkg.engine)
		pkg_search_obj.engine = pkg.engine;

	if (pkg.group)
		pkg_search_obj.group = pkg.group;

	return pkg_search_obj;

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
	  , group: pkg_data.group
	  , engine: pkg_data.engine
		, versions: [{
		    version: pkg_data.version
		  , engine_version: pkg_data.engine_version
		  , engine_metadata: pkg_data.engine_metadata
	    , direct_dependency_ids: pkg_data.direct_dependency_ids
	    , direct_dependency_versions: pkg_data.direct_dependency_versions
		  , license: pkg_data.license
		  , contents: pkg_data.contents
		  , url: pkg_data.url
		}]

	});

	async.waterfall([

		// save the package
		function(inner_callback){
			pkg.save( function(err){  
		    if (err) {
		      _delete_pkg(pkg._id, function() {
						inner_callback( error.fail( 'DB error creating new package') );
		      });	
		      return;
		    }
		    inner_callback(null);
		  });
		},
		// recursively discover all dependencies
		function(inner_callback) {
			exports.find_all_deps( pkg._id, pkg_data.version, function(err, d) {
				if (err) {
					_delete_pkg(pkg._id, function() {
						inner_callback( err );
		      });	
					return;
				}

				var all_dep_ids = [];
				var all_dep_vers = [];

				// build arrays from dictionary of all dependencies
				for (var dpkg in d) {
					for (var ver in d[dpkg]) {
						all_dep_ids.push(dpkg);
						all_dep_vers.push(ver);
					}
				}

				inner_callback(null, all_dep_ids, all_dep_vers);
			})
		},
		// save all dependencies to the pkg
		function(dep_ids, dep_versions, inner_callback) {

			pkg.versions[0].full_dependency_ids = dep_ids;
			pkg.versions[0].full_dependency_versions = dep_versions;
			pkg.markModified('versions');
			pkg.save( function(err){  
		    if (err) {
		      _delete_pkg(pkg._id, function() {
						inner_callback( error.fail( 'DB error updating full dependencies, removing package.') );
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
		// tell all of the dependencies the package that depends on them in pkg_data.dependency_ids
		function(inner_callback){

			if (pkg_data.direct_dependency_ids != undefined && pkg_data.direct_dependency_ids.length > 0 )
				exports.update_pkg_list_used_by( pkg._id, pkg_data.direct_dependency_ids, inner_callback );
			else
				inner_callback(null, []); // no dependencies were updated

		},
		// tell all the maintainers that the package they maintain in pkg_data.maintainer_ids
		function(pkgs, inner_callback){

			if (pkg_data.maintainer_ids != undefined && pkg_data.maintainer_ids.length > 0 )
				users.update_user_list_maintains( pkg, pkg_data.maintainer_ids, inner_callback );
			else
				inner_callback(null, []); // no maintainers were update

		},
		// update search
		function(users, inner_callback) { 
			search.add(pkg._id, exports.get_pkg_search_object(pkg), inner_callback );
		}
	], function(err, data) { // final callback for series
		if (err) {
			if (callback) callback(err);
			return;
		}

		if (callback) callback( error.success_with_content( 'Successfully inserted the package in the db', pkg) );
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

		var dup = false;
		for (var i = 0; i < pkg.used_by.length; i++) {
			if ( pkg.used_by[i].equals( dependent_pkg_id ) ){
				dup = true;
				break;
			}
		}

		if (!dup) {
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
 * Compare two package versions
 *
 * @param {String} A valid package version
 * @param {String} A valid package version, which ought to be greater then version 1
 * @api public
 */

exports.increasing_pkg_version = function(v1, v2) {

	// split into three fields
	var v1_fields = [], v2_fields = [];
	v1.split('.').forEach( function(field) {
		v1_fields.push( parseInt(field) );
	});

	v2.split('.').forEach( function(field) {
		v2_fields.push( parseInt(field) );
	});

	if (v1_fields.length != 3 || v2_fields.length != 3){
		return false; // malformed fields
	}

	var incr = false;

	for (var ind = 0; ind < v1_fields.length; ind++) {

		if (v1_fields[ind] < v2_fields[ind] ) {
			incr = true;
			break;
		}

		if (v1_fields[ind]  > v2_fields[ind] ){
			incr = false;
			break;
		}

	}

	// this is the case where all fields were the same
	return incr;

};

/**
 * Save a new package version into the db and updates package.  It is assumed that the pkg_vers_data is 
 * already validated and the user is authenticated and a maintainer of the package.
 *
 * @param {Object} The parsed and validated json from the client.
 * @param {Function} Callback to execute after inserting. The argument is an error object.
 * @api private
 */

function _save_new_pkg_version(pkg_data, callback) {

	var pkg_v = { 
			version: pkg_data.version
	  , engine_version: pkg_data.engine_version
	  , engine_metadata: pkg_data.engine_metadata
    , direct_dependency_ids: pkg_data.direct_dependency_ids
    , direct_dependency_versions: pkg_data.direct_dependency_versions
	  , license: pkg_data.license
	  , contents: pkg_data.contents
	  , url: pkg_data.url
	};

	async.waterfall([ 

		// update the package
		function(inner_callback){
	   PackageModel.findById(pkg_data.pkg_id, function(err, pkg) {

	   		if (err || !pkg) {
					inner_callback(error.fail('Could not find package when updating it with new version given id ' + pkg_data.pkg_id));
					return;
	   		}
	   	
	   		if ( !exports.increasing_pkg_version( pkg.versions[ pkg.versions.length-1].version, pkg_data.version ) ) {
					inner_callback(error.fail('The package version must be higher than the current highest version.'));
					return;
	   		}

	    	pkg.versions.push( pkg_v );
	    	pkg.markModified('versions');

	    	if (pkg_data.description != undefined) {
		    	pkg.description = pkg_data.description;
		    	pkg.markModified('description');
	    	}

	    	if (pkg_data.maintainer_ids != undefined ) {
		    	pkg.maintainers = pkg_data.maintainer_ids;
		    	pkg.markModified('maintainers');
	    	}

	    	if (pkg_data.group != undefined ) {
		    	pkg.group = pkg_data.group;
		    	pkg.markModified('group');
	    	}

	    	if (pkg_data.keywords != undefined ) {
		    	pkg.keywords = pkg_data.keywords;
		    	pkg.markModified('keywords');
	    	}

	    	pkg.save(function(err) {
	    		if (err) {
	    			inner_callback(error.fail('Failed to update save the changes to the package when creating new version.'))
	    		}
	    		inner_callback(null, pkg);
	    	});
	    	
	    });
		},
		// recursively discover all dependencies
		function(pkg, inner_callback) {

			exports.find_all_deps( pkg._id, pkg_data.version, function(err, d) {
				if (err) {
					_delete_pkg_version(pkg._id, pkg_data.version, function() {
						inner_callback( err );
		      });	
					return;
				}

				var all_dep_ids = [];
				var all_dep_vers = [];

				// build arrays from dictionary of all dependencies
				for (var dpkg in d) {
					for (var ver in d[dpkg]) {
						all_dep_ids.push(dpkg);
						all_dep_vers.push(ver);
					}
				}

				inner_callback(null, pkg, all_dep_ids, all_dep_vers);
			})
		},
		// save all dependencies to the pkg
		function(pkg, dep_ids, dep_versions, inner_callback) {

			pkg.versions[pkg.versions.length-1].full_dependency_ids = dep_ids;
			pkg.versions[pkg.versions.length-1].full_dependency_versions = dep_versions;
			pkg.markModified('versions');

			pkg.save( function(err){  
		    if (err) {
		      _delete_pkg_version(pkg._id, pkg_data.version, function() {
						inner_callback( error.fail( 'DB error updating full dependencies, removing package version.') );
		      });	
		      return;
		    }
		    inner_callback(null, pkg);
		  });

		},
		// update search    
		function(pkg, inner_callback) {
			search.update(pkg._id, exports.get_pkg_search_object(pkg), function(err) {
				if (err) {
					inner_callback(error.fail('Failed to update the search database'))
					return;
				}
				inner_callback(null, pkg);
			});
		},
		// tell all of the dependencies about the package that depends on them in pkg_data.dependency_ids
		function(pkg, inner_callback){
			if (pkg_data.direct_dependency_ids != undefined && pkg_data.direct_dependency_ids.length > 0 )
				exports.update_pkg_list_used_by( pkg._id, pkg_data.direct_dependency_ids, inner_callback );
			else
				inner_callback(null, []);
		},
		// tell all the maintainers that about the package they maintain in pkg_data.maintainer_ids, remove the maintainers that no longer do
		function(pkgs, inner_callback){
			if (pkg_data.maintainer_ids != undefined && pkg_data.maintainer_ids.length > 0 )
				users.update_user_list_maintains( pkg, pkg_data.maintainer_ids, inner_callback );
			else
				inner_callback(null, []);
		}
		], function(err, data) { // final callback for series

			if (err) {
				callback(err);
				return;
			}
			callback( error.success_with_content( 'Successfully inserted the package in the db', pkg_v) );

	});

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

	callback( error.fail('Not implemented'));

};


/**
 * Delete a package
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



