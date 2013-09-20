var PackageModel = require('../lib/models').PackageModel
	, UserModel = require('../lib/models').UserModel
  , error = require('./error')
  , packages = require('./packages')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , async = require('async');

exports.reconstruct_internal_pkg_stats = function(callback){

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

exports.reconstruct_internal_user_stats = function(callback){

	UserModel.find({}, function(err, users){

		if (err || !users || users.length == 0) {
			console.error('failed to get pks');
			callback(error.fail('Failed to get packages'));
			return;
		}
    
		// construct all the pkg updates
		var updates = [];
		_.each(users, function(pkg_it) {

			updates.push( (function(user) { return function(inner_callback){
				
				user.num_comments = user.comments.length;
				user.markModified('num_comments');
         
        user.num_dependents = user.used_by.length;
        user.markModified('num_dependents');     

				user.created = user.versions[0].created;
				user.markModified('created');

				user.latest_comment = user.comments.length > 0 ? _.last(user.comments).created : 0;
				user.markModified('latest_comment');

				user.latest_version_update = _.last( user.versions ).created;
				user.markModified('latest_version_update');

				user.num_versions = user.versions.length;
				user.markModified('num_versions');

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

exports.reconstruct_internal_pkg_stats(function(err){
	if (err) return console.error(err);
	console.log('success');
});


/**
 * Reconstruct all of the stats for a particular engine
 *
 * @param {string} engine whose stats should be updated
 * @param {Function} Callback to execute after look up. The argument is an error object and the stats object
 * @api public
 *
 */
/*
exports.reconstruct_stats = function(engine, callback){

async.waterfall([ 
		
		// get the stats object, initializing it if necessary
		function(inner_callback) {

			exports.get_stats_by_engine(engine, function(err, stats) {

				if (err || !stats) {
					return inner_callback(error.fail('Failed to get stats object'));
				}

				inner_callback(null, user); 

			});
		},
		// most common keywords
		function(stats, inner_callback) {

			PackageModel.find({engine: engine}, function(err, pkgs){

				if (err || !stats) {
					inner_callback(error.fail('Failed to get packages'));
					return;
				}

				// loop through packages adding to keywords
				var keyword_num_map = _.reduce(pkgs, function(memo, pkg){ 

					_.each(pkg.keywords, function(keyword){

						if (keyword_num_map[keyword]){
							keyword_num_map[keyword] += 1;
						} else {
							keyword_num_map[keyword] = 1;
						}

					});

					return memo;

				{});

				var keyword_num_arr =	_.pairs(keyword_num_map).sort();
				keyword_num_arr =	_.sortBy( keyword_num_arr, function(pair){ return pair.uses; } )

				stats.most_popular_keywords = keyword_num_arr;
				stats.markModified('most_popular_keywords');

				inner_callback(null, stats, pkgs);

			});

		},
		// most installed pkgs
		function(stats, pkgs, inner_callback) {

			pkgs.most_installed_packages =	_.sortBy( pkgs, function(pkg){ return pkg.downloads; } )
			stats.markModified('most_installed_packages');
			inner_callback(null, stats, pkgs);

		},
		// newest_packages 
		function(stats, pkgs, inner_callback) {

			pkgs.newest_packages =	_.sortBy( pkgs, function(pkg){ return -1 * _.first(pkg.versions).created; } )
			stats.markModified('newest_packages');
			inner_callback(null, stats, pkgs);

		},
		// most_depended_upon_packages 
		function(stats, pkgs, inner_callback) {

			pkgs.most_depended_upon_packages =	_.sortBy( pkgs, function(pkg){ return pkg.used_by.length; } )
			stats.markModified('most_depended_upon_packages');
			inner_callback(null, stats);

		},
		// get users
		function(stats, inner_callback) {

			// get users who are maintaining packages
			UserModel
				.find({})
				.$where('this.maintains.length &gt; 0')
				.select('maintains')
				.populate('maintains', 'votes downloads')
				.exec( function(err, authors ){
					inner_callback(err, stats, authors)
				});

		},
		// 
		function(stats, authors, inner_callback) {

			// get users who are maintaining packages
			UserModel
				.find({})
				.$where('this.maintains.length &gt; 0')
				.exec( inner_callback );

		},

	], function(err, stats) { // closing waterfall 

		if (err) {
				if (callback) callback(err);
				return;
			}

		stats.save(function(err){

			callback(null, stats);

		}
		

	});

}
*/
