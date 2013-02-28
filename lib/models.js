var mongoose = require('mongoose')  
  , Schema = mongoose.Schema;

var Package = new Schema({

  type: {type: String, default: 'DesignScript'}
  , usedBy: [ { type: Schema.ObjectId, ref: 'Package' }] 
  , votes: {type: Number, default: 0 }
  , versions: [{  version: {type: String}, 
                  user: {type: Schema.ObjectId, ref: 'PackageVersion'} }]

});

var PackageVersion = new Schema({

  version: {type: String, default: '0.0.1'}
  , creator: { type: Schema.ObjectId, ref: 'User' }
  , description: {type: String, default: 'No description'}
  , contents: {type: String, default: 'Some URL'}
  , uses: [ { space: { type: Schema.ObjectId, ref: 'PackageVersion' } } ]
  , created: {type: Date, default: Date.now}

});

var User = new Schema({

  username: {type: String }
  , packages_created: {type: Schema.ObjectId, ref: 'Package' }

});

exports.UserModel = mongoose.model('User', User);
exports.SpaceModel = mongoose.model('Package', Package);
