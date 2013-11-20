var PackageModel = require('../lib/models').PackageModel
  , error = require('./error')
  , packages = require('./packages')
  , mongoose = require('mongoose')
  , _ = require('underscore');



/**
 * Reconstruct all of the stats for a particular engine
 *
 * @param {string} engine whose stats should be updated
 * @param {Function} Callback to execute after look up. The argument is an error object and the stats object
 * @api public
 *
 */

exports.reconstruct_stats = function(engine, callback){


}

exports.most_common_keywords = function(engine, max_elements, callback){


}

exports.most_installed_packages = function(engine, max_elements, callback){


}

exports.newest_packages = function(engine, max_elements, callback){

  
}

exports.most_depended_upon_packages = function(engine, max_elements, callback){

  
}

exports.most_voted_for_authors = function(engine, max_elements, callback){


}

exports.least_voted_for_authors = function(engine, max_elements, callback){


}

exports.most_installed_authors = function(engine, max_elements, callback){


}

exports.most_prolific_authors = function(engine, max_elements, callback){


}

exports.most_recently_updated_packages = function(engine, max_elements, callback){


}

exports.most_commented_upon = function(engine, max_elements, callback){


}
