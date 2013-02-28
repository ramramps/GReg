var PackageModel = require('../lib/models').PackageModel
  , _ = require('underscore')
  , error = require('../lib/error_response');


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

  // create the object
  var instance = new PackageModel({
    type: type  
    , creator: socket.user_id
    , text: text
    , site: socket.site_id
  });
  
  // if (public_space) {
  //   Search.add( text, type, [], instance._id, socket.site_id );
  // }

  instance.save( function(err){  

    if (err)
    {
      console.error(err);
      callback({success: false, errornum: 3, message: 'Database error writing the space'});
      return
    }

    callback(instance);

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