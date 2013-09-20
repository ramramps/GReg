var PackageModel = require('../lib/models').PackageModel
  , error = require('./error')
  , packages = require('./packages')
  , mongoose = require('mongoose')
  , _ = require('underscore')
	, async = require('async');


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

  	if (!callback) return;

		// look at first element in versions
		PackageModel
			.find({engine: engine})	
			.sort('-num_dependents')
			.limit(limit)
			.select('downloads name maintainers group used_by')
      		.populate('maintainers', 'username')
			.exec(function(err, pkgs){

				if (err || !pkgs) return callback(err);

				callback(null, pkgs);

			});

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

