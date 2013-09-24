var app = app || {};


app.Stat = Backbone.Model.extend({

  idAttribute: "type",

  defaults: {
    variety: 'package'
    type: 'most_installed_package',
    list: '',
    metric: ''
  },

  stat_map: {
	  	most_installed_packages : 'downloads'
	  	, most_recently_updated_packages: 'latest_version_update'
	  	, most_depended_upon_packages: 'num_dependents'
	  	, most_commented_upon_packages: 'comments'
	  	, most_voted_for_authors: 'num_votes_for_maintained_packages'
	  	, most_installed_authors: 'num_downloads_for_maintained_packages'
	  	, most_prolific_authors: 'num_maintained_packages'
	}

  parse: function(stuff) {

  	if (this.stat_map[stuff.type]){
  		stuff.metric = this.stat_map[stuff.type];
  	} 

  	console.log(stuff)

    return stuff;
  }

});
