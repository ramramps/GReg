var PackageModel = require('../lib/models').PackageModel
  , UserModel = require('../lib/models').UserModel
  , error = require('../lib/error')
  , packages = require('../lib/packages')
  , mongoose = require('mongoose')
  , search = require('../lib/search')
  , _ = require('underscore');

/**
 * Vote for a package
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */
exports.upvote_pkg_by_id = function(req, res) {

  var pkd_id = req.params.id
    , user_id = req.user._id;

  packages.vote( pkg_id, user_id, -1, res );

};

/**
 * Vote for a package
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */
exports.downvote_pkg_by_id = function(req, res) {

  var pkd_id = req.params.id
    , user_id = req.user._id;

  packages.vote( pkg_id, user_id, -1, res );

};




/**
 * Download the most recent version of a package given an id
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 *
 */

exports.download_last_vers = function(req, res) {

  var id = req.params.id;
  var version = req.params.version;

  PackageModel.findById(id, function(err, pkg) {

    console.log( pkg )

    if ( err || !pkg ) {
      try {
        return res.send( error.fail("Could not find package") );
      } catch (exception) {
        return res.send(500, error.fail("Failed to obtain package"));
      }
    }

    try {
      return res.redirect( pkg.versions[pkg.versions.length-1].url )
    } catch (exception) {
      return res.send(500, error.fail('Failed to obtain package version' ));
    }

    return res.send(500, error.fail('Something unexpected happened' ));

  });

};


/**
 * Download a package given an id and version
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 *
 */

exports.download_vers = function(req, res) {

  var id = req.params.id;
  var version = req.params.version;

  PackageModel.findById(id, function(err, pkg) {

    if ( err || !pkg ) {
      try {
        return res.send( error.fail("Could not find package") );
      } catch (exception) {
        res.send(500, error.fail('Failed to obtain the package' ));
        return console.log('Log error - failed to download a package with id: ' + id);
      }
    }

    // check the version exists, and return it if possible
    for (var i = 0; i < pkg.versions.length; i++) {
      if ( version === pkg.versions[i].version ) {  
        try {
          console.log()
          return res.redirect( pkg.versions[i].url )
        } catch (exception) {
          return res.send(500, error.fail('Failed to redirect' ));
        }
      }
    }

    return res.send(404, error.fail('The version you specified does not exist' ));

  });

};

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
      console.log('Error')
      try {
        return res.send( error.fail("Could not find package") );
      } catch (exception) {
        res.send(500, error.fail('Failed to obtain the package' ));
        return console.log('Log error - failed to download a package with id: ' + id);
      }
    }

    var data = error.success_with_content('Found package', pkg);
    try {
      return res.send(data);
    } catch (exception) {
      res.send(500, error.fail('Failed to send data' ));
      return console.log('Log error');
    }

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

  PackageModel
  .find({})
  .populate('maintainers', 'username')
  .populate('versions.direct_dependency_ids', 'name')
  .populate('versions.full_dependency_ids', 'name')
  .populate('used_by', 'name')
  .exec(function (err, pkgs) {

    if ( err || !pkgs ) {
      try {
        return res.send( error.fail("There are no packages") );
      } catch (exception) {
        res.send(500, error.fail('Error obtaining packages' ));
        return console.log('Log error');
      }
    }

    var data = error.success_with_content('Found packages', pkgs);
    try {
      return res.send( data );
    } catch (exception) {
      res.send(500, error.fail('Failed to send data' ));
      return console.log('Log error');
    }

  })

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
      res.send( 404, error.fail("There are no packages with that engine name") );
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
      return res.send( 404, error.fail("There is no package with that engine and package name") );
    }

    var data = error.success_with_content('Found package', pkg);
    return res.send( data );

  });

};

/**
 * Search for a package
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.search = function(req, res) {

  var q = req.params.query;

  if (!q) {
    exports.all(req, res);
    return;
  }

  search.pkg_search(q, function(err, data) {

    if (err) {
      res.send(500, error.fail('Something wrong with the pkg_search'));
      return;
    }

    if (data.Body.hits.found === 0) {
      res.send(error.success_with_content( "Succeeded", [] ) );
      return;
    }

    var ids = [];
    _.each( data.Body.hits.hit, function(id){

      ids.push(id.id);

    });

    packages.get_pkg_list(ids, function(err, pkgs) {

      if (err) {
        return res.send(500, error.fail('Failed to get packages from db'));
      }

      try {
        return res.send(error.success_with_content('Search succeeded', pkgs));
      } catch (e) {
        return console.error('There was a problem returning the search results.')
      }

    });

  });

}

/**
 * Add a new package
 *
 * @param {Object} HTTP request 
 * @param {Object} HTTP response
 * @api public
 */

exports.add = function(req, res) {

  if (!req.body.pkg_header){
    return res.send(400, error.fail('You did not provide a pkg_header'));
  }

  if (!req.files.pkg){
    return res.send(400, error.fail('You did not provide a pkg file'));
  }

  var pkg = JSON.parse( req.body.pkg_header );

  packages.save_new_pkg(req, pkg, function(result) {
    try {
      return res.send(result);
    } catch (exception) {
      return console.error('Failed to send result')
    }
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

  if (!req.body.pkg_header){
    return res.send(400, error.fail('You did not provide a pkg_header'));
  }

  if (!req.files.pkg){
    return res.send(400, error.fail('You did not provide a pkg file'));
  }

  var pkg = JSON.parse( req.body.pkg_header );

  packages.save_new_pkg_version(req, pkg, function(result) {
    try {
      return res.send(result);
    } catch (exception) {
      return res.send(500, error.fail('Failed to save package version'));
    }
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
