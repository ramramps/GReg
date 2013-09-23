var PackageModel = require('../lib/models').PackageModel
	, UserModel = require('../lib/models').UserModel
  , error = require('./error')
  , packages = require('./packages')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , async = require('async');


exports.synchronize_package_stats = function(callback){

	PackageModel.find({}, function(err, pkgs){

		if (err || !pkgs || pkgs.length == 0) {
			console.error('failed to get pks');
			callback(error.fail('Failed to get packages'));
			return;
		}
    
		// construct all the pkg updates
		var updates = [];
		_.each(pkgs, function(pkg_it) {

			updates.push( (function(pkg) { return function(inner_callback){
				
				pkg.num_comments = pkg.comments.length;
				pkg.markModified('num_comments');
         
        pkg.num_dependents = pkg.used_by.length;
        pkg.markModified('num_dependents');     

				pkg.created = pkg.versions[0].created;
				pkg.markModified('created');

				pkg.latest_comment = pkg.comments.length > 0 ? _.last(pkg.comments).created : 0;
				pkg.markModified('latest_comment');

				pkg.latest_version_update = _.last( pkg.versions ).created;
				pkg.markModified('latest_version_update');

				pkg.num_versions = pkg.versions.length;
				pkg.markModified('num_versions');

				pkg.save(inner_callback);

			};})(pkg_it));

		});

		async.parallel(updates, function(err){
			if (err) return console.error(err);
			callback(error.success());
		});

	});

}


exports.synchronize_user_stats = function(callback){

	UserModel
		.find({})
		.populate('maintains', 'votes downloads num_comments latest_version_update')
		.exec(function(err, users){

			if (err || !users || users.length == 0) {
				console.error('failed to get users');
				return callback(error.fail('Failed to get users'));
			}

			var updates = [];
			_.each(users, function(pkg_it) {

				updates.push( (function(user) { return function(inner_callback){

					user.num_votes_for_maintained_packages = _.reduce(user.maintains, function(memo, pkg){ return memo + pkg.votes; }, 0);
					user.markModified('num_votes_for_maintained_packages'); 

					user.num_downloads_for_maintained_packages =  _.reduce(user.maintains, function(memo, pkg){ return memo + pkg.downloads; }, 0);
					user.markModified('num_downloads_for_maintained_packages'); 

					user.num_maintained_packages = user.maintains.length;
					user.markModified('num_maintained_packages'); 
					
					if (user.num_maintained_packages > 0){
						var last_update_time  = 0;
            var last_updated_pkg  = _.first(user.maintains);
            _.each(user.maintains, function(pkg){if (pkg.latest_version_update.getTime() > last_update_time) last_updated_pkg = pkg });
  
						user.last_updated_package = last_updated_pkg;	
  	        user.markModified('last_updated_package');     
					}
 
					user.save(inner_callback);

				};})(pkg_it));

			});

			async.parallel(updates, function(err){
				if (err) return console.error(err);
				callback(error.success());
			});

		});

}


exports.cleanup_user_maintains = function(callback){

	UserModel
		.find({})
		.exec(function(err, users){

			if (err || !users || users.length == 0) {
				console.error('failed to get users');
				return callback(error.fail('Failed to get users'));
			}
	    
			var updates = [];
			_.each(users, function(pkg_it) {

				updates.push( (function(user) { return function(inner_callback){

          user.maintains = user.maintains.filter(function(elem, pos) {
		    		return user.maintains.indexOf(elem) == pos;
					});
					user.markModified('maintains');  
					user.save(inner_callback);

				};})(pkg_it));

			});

			async.parallel(updates, function(err){
				if (err) return console.error(err);
				callback(error.success());
			});

		});

}

////////////////////////
// DB
////////////////////////

var mongoDbName = process.env.GREG_DB_NAME;
var mongoDbUrl = process.env.GREG_DB_URL;
var mongoUri = mongoDbUrl + mongoDbName;	

mongoose.connect(mongoUri, function(err) {
if (!err) {
   console.log('Connected to MongoDB at ' + mongoUri);
  } else {
    throw err;
  }
});

// exports.synchronize_package_stats(function(err){
// 	if (err) return console.error(err);
// 	console.log('success');
// });
/*
exports.cleanup_user_maintains(function(err){
	if (err) return console.error(err);
	console.log('success');
});
*/

exports.synchronize_user_stats(function(err){
	if (err) return console.error(err);
	console.log('success');
});


