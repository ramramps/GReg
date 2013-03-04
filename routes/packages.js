var PackageModel = require('../lib/models').PackageModel
  , _ = require('underscore')
  , error = require('../lib/error')
  , packages = require('../lib/packages')

// TODO: validation for all data

exports.byId = function(req, res) {

  var id = req.params.id;
  console.log('Retrieving pkg: ' + id);

  PackageModel.findById( id, function(err, pkg) {

    if ( err || !pkg )
    {
      res.send( error.create("Could not find package") );
    }

    // we want to populate the most recent version, get its innards

    return res.send( pkg );

  });

};

exports.all = function(req, res) {

  PackageModel.find( {}, function(err, pkgs) {

    if ( err || !pkg )
    {
      res.send( error.create("There are no packages") );
    }

    return pkgs;

  });

};

// not implemented
exports.download = exports.byId;

// requires authentication
exports.add = function(req, res) {

  var pkg = req.body;
  console.log('Adding pkg: ' + JSON.stringify(pkg));

  packages.add(package_data, function(err) {
    if (err) {
      res.send('Failed to add the package data');
      return;
    }

    res.send('Successfully added package data');

  });

}

exports.add_version = function(req, res) {

  var pkg = req.body;
  console.log('Adding pkg: ' + JSON.stringify(pkg));

  packages.add(package_data, function(err) {
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