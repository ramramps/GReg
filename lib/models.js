var mongoose = require('mongoose')  
  , Schema = mongoose.Schema;

var Package = new Schema({

  name: {type: String}
  , created: {type: Date, default: Date.now}  // new
  
  , keywords: [{type: String}]
  , maintainers: [{ type: Schema.ObjectId, ref: 'User' }]
  , description: {type: String, default: 'No description provided!'}
  , used_by: [ { type: Schema.ObjectId, ref: 'Package' }] 
  , votes: {type: Number, default: 0 }
  , license: {type: String, default: 'MIT'}
  , engine: {type: String, default: 'dynamo'}
  , downloads: {type: Number, default: 0 }
  , group: {type: String, default: 'global'}
  , deprecated: {type: Boolean, default: false }

	, site_url: {type: String, default: '' }
  , repository_url: {type: String, default: ''}

  , latest_comment: {type: Number, default: 0 }  
  , num_comments: {type: Number, default: 0 }  
	, comments: [{
      text: {type: String, default: ''}
    , created: {type: Date, default: Date.now}
    , user: { type: Schema.ObjectId, ref: 'User' }
  }]

  , num_versions: {type: Number, default: 0 }  // new
  , latest_version_update: {type: Date, default: Date.now}   // new

  , versions: [ {
      version: {type: String, default: '0.0.1'}
    , change_log: {type: String, default: ''}
		, direct_dependency_ids: [ { type: Schema.ObjectId, ref: 'Package' } ]
    , direct_dependency_versions: [ {type: String, default: '0.0.1'} ]
    , full_dependency_ids: [ { type: Schema.ObjectId, ref: 'Package' } ]
    , full_dependency_versions: [ {type: String, default: '0.0.1'} ]
    , created: {type: Date, default: Date.now}
    , engine_version: {type: String, default: '0.0.1'}
    , engine_metadata: {type: String, default: ''}
    , contents: {type: String, default:''}
    , url: {type: String, default: 'none'}
		, url_with_deps: {type: String, default: ''} 
  }]
  
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

var Stats = new Schema({

  engine: {type: String, default: ''}
  , most_popular_keywords: [{
      keyword: {type: String, default: ''}
    , uses: {type: Number, default: 0 }
  }]
  , most_installed_packages: [ {type: Schema.ObjectId, ref: 'Package' } ]
  , newest_packages: [ {type: Schema.ObjectId, ref: 'Package' } ]
  , most_depended_upon_packages: [ {type: Schema.ObjectId, ref: 'Package' } ]
  , most_voted_for_authors: [{type: Schema.ObjectId, ref: 'User' }]
  , least_voted_for_authors: [{type: Schema.ObjectId, ref: 'User' }]
  , most_installed_authors: [{type: Schema.ObjectId, ref: 'Package' }]
  , most_prolific_authors: [{type: Schema.ObjectId, ref: 'Package' }]
  , most_recently_updated_packages: [{type: Schema.ObjectId, ref: 'Package' }]
  , most_commented_upon: [{type: Schema.ObjectId, ref: 'Package' }]

});


exports.StatsModel = mongoose.model('Stats', Stats);
exports.UserModel = mongoose.model('User', User);
exports.PackageModel = mongoose.model('Package', Package);
