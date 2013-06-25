var mongoose = require('mongoose')  
  , Schema = mongoose.Schema;

var Package = new Schema({

  name: {type: String}
  , keywords: [{type: String}]
  , maintainers: [{ type: Schema.ObjectId, ref: 'User' }]
  , description: {type: String, default: 'No description provided'}
  , used_by: [ { type: Schema.ObjectId, ref: 'Package' }] 
  , votes: {type: Number, default: 0 }
  , license: {type: String, default: 'MIT'}
  , engine: {type: String, default: 'dynamo'}
  , downloads: {type: Number, default: 0 }
  , group: {type: String, default: 'global'}
  , deprecated: {type: Boolean, default: false }
  , versions: [ {
      version: {type: String, default: '0.0.1'}
    , direct_dependency_ids: [ { type: Schema.ObjectId, ref: 'Package' } ]
    , direct_dependency_versions: [ {type: String, default: '0.0.1'} ]
    , full_dependency_ids: [ { type: Schema.ObjectId, ref: 'Package' } ]
    , full_dependency_versions: [ {type: String, default: '0.0.1'} ]
    , created: {type: Date, default: Date.now}
    , engine_version: {type: String, default: '0.0.1'}
    , engine_metadata: {type: String, default: ''}
    , contents: {type: String, default: 'Some Code'}
    , url: {type: String, default: 'none'} } ]
  
});

var User = new Schema({

  username: {type: String }
  , email: {type: String, default: ''}
  , oxygen_id : {type: String, default: ''}
  , eidm_guid : {type: String, default: ''}
  , first_name : {type: String, default: ''}
  , last_name : {type: String, default: ''}
  , country_code: {type: String, default: 'US'}
  , language : {type: String, default: 'en'}
  , maintains: [{type: Schema.ObjectId, ref: 'Package' }]
  , has_downvoted: [{type: Schema.ObjectId, ref: 'Package' }]
  , has_upvoted: [{type: Schema.ObjectId, ref: 'Package' }]

});

exports.UserModel = mongoose.model('User', User);
exports.PackageModel = mongoose.model('Package', Package);
