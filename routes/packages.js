var PackageModel = require('../lib/models').PackageModel
  , _ = require('underscore')
  , error = require('../lib/error')
  , packages = require('../lib/packages')


exports.byId = function(req, res) {

  var id = req.params.id;
  console.log('Retrieving pkg: ' + id);

  PackageModel.findOne( {id: id}, function(err, pkg) {

    if ( err || !pkg ) {
      console.log('Could not find pkg')
      console.log(err);
      res.send( error.fail("Could not find package") );
      return;
    }

    console.log('Sending pkg')
    return res.send( pkg );

  });

};

exports.all = function(req, res) {

  PackageModel.find( {}, function(err, pkgs) {

    if ( err || !pkgs )
    {
      res.send( error.fail("There are no packages") );
      return;
    }

    return res.send( pkgs );

  });

};

// not implemented
exports.download = exports.byId; // this gets both the package and its dependencies

// requires authentication
exports.add = function(req, res) {

  var pkg = req.body;

  packages.save_new_pkg(req, pkg, function(result) {
    res.send(result);
  });

}

exports.add_version = function(req, res) {

  var pkg = req.body;

  packages.save_new_pkg_version(req, pkg, function(result) {
    res.send(result);
  });

}

exports.remove = function(req, res) {
  var id = req.params.id;
  console.log('Deleting pkg: ' + id);
  res.send({thing: 'hi'});
}

exports.populateDB = function() {




};