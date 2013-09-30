var app = app || {};

function prettyDate(time){
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
		diff = (((new Date()).getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400)
		month_diff = Math.floor(day_diff / 30);
	
	if ( isNaN(day_diff) || day_diff < 0 )
		return;
			
  console.log('prettyDate');		
	if (month_diff > 0){
	  return month_diff + ( month_diff > 1 ?  " months ago" : " month ago");
	}

  return day_diff == 0 && (	
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago"; 
}

app.Stat = Backbone.Model.extend({

  idAttribute: "type",

  defaults: {
    variety: 'package',
    type: 'most_installed_package',
    list: '',
    metric: ''
  },

  stat_map: {
	  	most_installed_packages : function(pkg) { return pkg.downloads; } 
	  	, newest_packages: function(pkg){ return prettyDate( pkg.created ); } 
      , most_recently_updated_packages: function(pkg) { return prettyDate( pkg.latest_version_update ); }
	  	, most_depended_upon_packages: function( pkg ) { return pkg.num_dependents; }
	  	, most_commented_upon_packages: function(pkg) { return pkg.num_comments; }
	  	, most_voted_for_authors: function(user) { return user.num_votes_for_maintained_packages; }
	  	, most_installed_authors: function(user) { return user.num_downloads_for_maintained_packages; }
	  	, most_prolific_authors: function(user){ return user.num_maintained_packages; }
	  	, most_recently_active_authors: function(user){ return prettyDate(user.last_updated_package.latest_version_update); }
	},

  parse: function(stuff) {

  	if (this.stat_map[stuff.type]){
			var that = this;
		  _.each( stuff.list, function(ele){ ele.metric = that.stat_map[stuff.type](ele); });
  		_.each( stuff.list, function(ele){ if (ele.username) ele.username = ele.username.replace(/\w{1,5}@\w{1,5}/,' ... '); });
		} 

    stuff.type = stuff.type.split('_').join(' ');
    return stuff;
  }

});
