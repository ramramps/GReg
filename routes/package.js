var PackageModel = require('../lib/models').PackageModel
  , error = require('../lib/error')
  , packages = require('../lib/packages')
  , mongoose = require('mongoose');

/**
 * Lookup a package by id
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.by_id = function(req, res) {

  var id = req.params.id;

  PackageModel.findById(id, function(err, pkg) {

    if ( err || !pkg ) {
      console.log('Could not find pkg')
      console.log(err);
      res.send( error.fail("Could not find package") );
      return;
    }

    var data = error.success_with_content('Found package', pkg);
    return res.send( data );

  });

};

/**
 * Get all packages
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.all = function(req, res) {

  PackageModel.find( {}, function(err, pkgs) {

    if ( err || !pkgs )
    {
      res.send( error.fail("There are no packages") );
      return;
    }

    var data = error.success_with_content('Found packages', pkgs);
    return res.send( data );

  });

};


/**
 * Lookup all packages with a particular engine
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.by_engine = function(req, res) {

  var engine = req.params.engine;

  PackageModel.find( {engine: engine} , function(err, pkgs) {

    if ( err || !pkgs || pkgs.length === 0 )
    {
      res.send( error.fail("There are no packages with that engine name") );
      return;
    }

    var data = error.success_with_content('Found packages', pkgs);
    return res.send( data );

  });

};


/**
 * Lookup a package by engine and name.  Returns only a single package.
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.by_engine_and_name = function(req, res) {

  var engine = req.params.engine;
  var name = req.params.name;

  PackageModel.findOne( {engine: engine, name: name} , function(err, pkg) {

    if ( err || !pkg )
    {
      res.send( error.fail("There is no package with that engine and package name") );
      return;
    }

    var data = error.success_with_content('Found package', pkg);
    return res.send( data );

  });

};


/**
 * Download a package (along with all its dependencies)
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.download = exports.by_id; // this gets both the package and its dependencies

/**
 * Add a new package
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.add = function(req, res) {

  var pkg = req.body;

  packages.save_new_pkg(req, pkg, function(result) {
    res.send(result);
  });

}

/**
 * Add a new package version
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.add_version = function(req, res) {

  var pkg = req.body;

  packages.save_new_pkg_version(req, pkg, function(result) {
    res.send(result);
  });

}

/**
 * Delete a package from the db
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.remove = function(req, res) {
  var id = req.params.id;
  res.send({thing: 'hi'});
}
