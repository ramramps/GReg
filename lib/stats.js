var PackageModel = require('../lib/models').PackageModel
	, UserModel = require('../lib/models').UserModel
  , error = require('./error')
  , packages = require('./packages')
  , mongoose = require('mongoose')
  , _ = require('underscore')
	, async = require('async');

// combined stats

exports.all_stats = function(limit, callback){

	var all_stats = [];

	// get all pkg stats
	async.parallel( [

		function(inner_callback){
			exports.all_user_stats(limit, function(err, user_stats){
      	if (err) return inner_callback(err);
			  for (var attrname in user_stats) { 
			  	var stat = {};
			  	stat.list = user_stats[attrname]; 
			  	stat.variety = "author";
			  	stat.type = attrname;
			  	all_stats.push(stat);
			  }
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.all_engine_stats(null, limit, function(err, pkg_stats){
				if (err) return inner_callback(err);
				for (var attrname in pkg_stats) { 
			  	var stat = {};
			  	stat.list = pkg_stats[attrname]; 
			  	stat.variety = "package";
			  	stat.type = attrname;
			  	all_stats.push(stat);
				}
        inner_callback(null);
			});

		}], function(err){ 
			if (err) return callback(err);
			callback(null, all_stats);
	});

}

exports.all_engine_stats = function(engine, limit, callback){

	var all_stats = {}; // we will collect stats in parallel on this object

	// get all pkg stats
	async.parallel( [

		function(inner_callback){
			exports.most_installed_packages(engine, limit, function(err, pkgs){
				if (err) return inner_callback(error);
				all_stats["most_installed_packages"] = pkgs;
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.newest_packages(engine, limit, function(err, pkgs){
				if (err) return inner_callback(error);
				all_stats["newest_packages"] = pkgs;
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.most_recently_updated_packages(engine, limit, function(err, pkgs){
				if (err) return inner_callback(error);
				all_stats["most_recently_updated_packages"] = pkgs;
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.most_depended_upon_packages(engine, limit, function(err, pkgs){
				if (err) return inner_callback(error);
				all_stats["most_depended_upon_packages"] = pkgs;
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.most_commented_upon_packages(engine, limit, function(err, pkgs){
				if (err) return inner_callback(error);
				all_stats["most_commented_upon_packages"] = pkgs;
				inner_callback(null);
			});
		}], function(err){ 
			if (err) return callback(err);
			callback(null, all_stats);
	});

}

exports.all_user_stats = function(limit, callback){

	var all_stats = {}; // we will collect stats in parallel on this object

	// get all pkg stats
	async.parallel( [

		function(inner_callback){
			exports.most_recently_active_authors(limit, function(err, users){
				if (err) return inner_callback(error);
				all_stats["most_recently_active_authors"] = users;
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.most_prolific_authors(limit, function(err, users){
				if (err) return inner_callback(error);
				all_stats["most_prolific_authors"] = users;
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.most_installed_authors(limit, function(err, users){
				if (err) return inner_callback(error);
				all_stats["most_installed_authors"] = users;
				inner_callback(null);
			});
		}
	, function(inner_callback){
			exports.most_voted_for_authors(limit, function(err, users){
				if (err) return inner_callback(error);
				all_stats["most_voted_for_authors"] = users;
				inner_callback(null);
			});
		}], function(err){ 
			if (err) return callback(err);
			callback(null, all_stats);
	});

}

// package statistics

exports.most_installed_packages = function(engine, limit, callback){
	return pkg_sort_by('-downloads', engine, limit, callback);
}

exports.newest_packages = function(engine, limit, callback){
	return pkg_sort_by('-created', engine, limit, callback);
}

exports.most_recently_updated_packages = function(engine, limit, callback){
	return pkg_sort_by('-latest_version_update', engine, limit, callback);
}

exports.most_depended_upon_packages = function(engine, limit, callback){
  return pkg_sort_by('-num_dependents', engine, limit, callback);
}

exports.most_commented_upon_packages = function(engine, limit, callback){
	return pkg_sort_by('-num_comments', engine, limit, callback);
}


// author stats

exports.most_voted_for_authors = function( limit, callback){
	return user_sort_by('-num_votes_for_maintained_packages', limit, callback);
}

exports.most_installed_authors = function( limit, callback){
	return user_sort_by('-num_downloads_for_maintained_packages', limit, callback);
}

exports.most_prolific_authors = function( limit, callback){
	return user_sort_by('-num_maintained_packages', limit, callback);
}

exports.most_recently_active_authors = function( limit, callback){
	
	// provisional fix as sort is not properly working on inner populate field
	return user_sort_by('username', 100, function(err, users){
		if (err) return callback( err );
		
		users.sort(function(a_d,b_d){
			
			var a = new Date(a_d.last_updated_package.latest_version_update)
				, b = new Date(b_d.last_updated_package.latest_version_update);	
			
			return b<a?-1:b>a?1:0;
	
		});

		users = users.slice(0, limit);
		
		callback( null, users );

	});
}


function pkg_sort_by(field_to_sort_on, engine, limit, callback){

	if (!callback) return;

	PackageModel
		.find(engine ? {engine: engine} : {})	
		.where('deprecated').equals(false)
		.sort(field_to_sort_on)
		.limit(limit)
		.select('downloads name maintainers num_dependents group created latest_version_update used_by')
    .populate('maintainers', 'username')
		.exec(function(err, pkgs){
			if (err || !pkgs) return callback(err);
			callback(null, pkgs);
		});

}

function user_sort_by(field_to_sort_on, limit, callback){

	if (!callback) return;

	UserModel
		.find({})
		.where('num_maintained_packages').gt(0)
		.select('username email first_name last_name last_updated_package num_maintained_packages num_votes_for_maintained_packages num_downloads_for_maintained_packages')
		.populate('last_updated_package', 'latest_version_update')
		.sort(field_to_sort_on)
		.limit(limit)
		.exec(function(err, users){
			if (err || !users) return callback(err);
			callback(null, users);
		});

}

// exports.most_common_keywords = function( limit, callback){

// }

// exports.most_common_group = function( limit, callback){

// }

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
