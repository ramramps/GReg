var PackageModel = require('../lib/models').PackageModel
  , error = require('./error')
  , packages = require('./packages')
  , mongoose = require('mongoose')
  , _ = require('underscore')
	, async = require('async');


/**
 * Reconstruct all of the stats for a particular engine
 *
 * @param {string} engine whose stats should be updated
 * @param {Function} Callback to execute after look up. The argument is an error object and the stats object
 * @api public
 *
 */
/**
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

/**
 * Obtain the stats for a particular engine, creating an empty stats object in the db if 
 * it doesn't already exist.
 *
 * @param {string} engine whose stats are needed
 * @param {Function} Callback to execute after look up. The argument is an error object and the stats object
 * @api public
 *
 */

exports.get_stats_by_engine = function(engine, callback){


}

exports.most_common_keywords = function(engine, limit, reconstruct, callback){


}


exports.most_installed_packages = function(engine, limit, reconstruct, callback){

		if (!callback) return;

		PackageModel
			.find({engine: engine})
			.sort('-downloads')
			.limit(limit)
			.select('downloads name maintainers group')
      .populate('maintainers', 'username')
			.exec(function(err, pkgs){

				if (err || !pkgs) return callback(err);

				callback(null, pkgs);

			});

	// 	return StatsModel
	// 		.find({engine: engine})
	// 		.populate({
	// 		  path: 'most_installed_packages',
	// 		  options: { limit: limit }
	// 		})
	// 		.exec( function( err, stats ){
	// 			if (err && callback) return callback(err);
	// 			callback(null, stats.most_installed_packages);
	// 		}


	// return exports.get_stats_by_engine(engine, function(err, stats) {

	// 	if (err || !stats) {
	// 		return inner_callback(error.fail('Failed to get stats object'));
	// 	}

	// 	PackageModel
	// 		.find({engine: engine})
	// 		.sort('-downloads')
	// 		.select('_id')
	// 		.exec(function(err, pkgs){

	// 				stats.most_installed_packages = pkgs;
	// 				stats.markModified('most_installed_packages');
	// 				stats.save(function(err){
	// 					callback(null, stats, pkgs);
	// 				})

	// 			});

//	});


}

exports.newest_packages = function(engine, limit, reconstruct, callback){

  
}

exports.most_recently_updated_packages = function(engine, limit, reconstruct, callback){


}

exports.most_depended_upon_packages = function(engine, limit, reconstruct, callback){

  
}

exports.most_commented_upon_packages = function(engine, limit, reconstruct, callback){


}


exports.most_voted_for_authors = function(engine, limit, reconstruct, callback){


}

exports.least_voted_for_authors = function(engine, limit, reconstruct, callback){


}

exports.most_installed_authors = function(engine, limit, reconstruct, callback){


}

exports.most_prolific_authors = function(engine, limit, reconstruct, callback){


}

