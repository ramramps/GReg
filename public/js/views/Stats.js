
var app = app || {};

app.StatsView = Backbone.View.extend({

  el: '#browse_container',

  events: {
    
  },

  initialize: function() { 
    this.$authors = this.$('#author_stats');
		this.$packages = this.$('#package_stats');
    this.listenTo(app.Stats, 'sync', this.render );
  },

  render: function(arg) {

		$('.loading_container').hide();
	
    var that = this;
		
		app.Stats.comparator = function(chapter) {
    	return String.fromCharCode.apply(String,
        _.map(chapter.get("type").split(""), function (c) {
            return 0xffff - c.charCodeAt();
        })
    	);
		}   
		
		app.Stats.sort(); 

    // render stats
    app.Stats.forEach(function(stat) {

      if (stat.get('variety') === "author"){
    		
        var view = new app.AuthorStatView({ model: stat });
				stat.set('type', stat.get('type').replace('authors', ''));
				view.render();
      	that.$authors.append( view.$el );
      } else {

				if (stat.get('type').indexOf('comment') != -1) return;
        var view = new app.PackageStatView({ model: stat });
				stat.set('type', stat.get('type').replace('packages', ''));
				view.render();
      	that.$packages.append( view.$el );
			}
  
    });

  }

});
