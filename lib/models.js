var mongoose = require('mongoose')  
  , Schema = mongoose.Schema;

var Package = new Schema({

  name: {type: String}
  , keywords: [{type: String}]
  , maintainers: [{ type: Schema.ObjectId, ref: 'User' }]
  , description: {type: String, default: 'No description provided'}
  , used_by: [ { type: Schema.ObjectId, ref: 'Package' }] 
  , votes: {type: Number, default: 0 }
  , versions: [{  version: {type: String}, 
                  id: {type: Schema.ObjectId, ref: 'PackageVersion'} }]
  , license: {type: String, default: 'MIT'}
  , downloads: {type: Number, default: 0 }
  
});

var PackageVersion = new Schema({

  package: { type: Schema.ObjectId, ref: 'Package' }
  , version: {type: String, default: '0.0.1'}
  , uses: [ { space: { type: Schema.ObjectId, ref: 'PackageVersion' } } ]
  , created: {type: Date, default: Date.now}
  , engine: {type: String, default: 'Dynamo'}
  , engine_version: {type: String, default: '0.0.3'}
  , engine_metadata: {type: String, default: ''}
  , contents: {type: String, default: 'Some URL'}

});

var User = new Schema({

  username: {type: String }
  , maintains: [{type: Schema.ObjectId, ref: 'Package' }]

});

exports.UserModel = mongoose.model('User', User);
exports.PackageModel = mongoose.model('Package', Package);
exports.PackageVersionModel = mongoose.model('PackageVersion', PackageVersion);
