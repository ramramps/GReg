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
  console.log('Adding pkg: ' + JSON.stringify(pkg));

  packages.save_new_pkg(pkg, function(err) {

    res.send(err);

  });

}

exports.add_version = function(req, res) {

  var pkg = req.body;
  console.log('Adding pkg: ' + JSON.stringify(pkg));

  packages.add(req, package_data, function(err) {

    if (err) {
      res.send('Failed to add the package data');
      return;
    }

    res.send('Successfully added package data');

  });

}

exports.update = function(req, res) {
  var id = req.params.id;
  var pkg = req.body;
  console.log('Updating pkg: ' + id);
  res.send({thing: 'hi'});
}

exports.remove = function(req, res) {
  var id = req.params.id;
  console.log('Deleting pkg: ' + id);
  res.send({thing: 'hi'});
}

exports.populateDB = function() {




};