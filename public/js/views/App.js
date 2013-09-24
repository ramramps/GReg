
var app = app || {};

app.AppView = Backbone.View.extend({

  el: '#app',

  events: {
    'keyup .search': 'instantSearch'
  },

  initialize: function() { 
    this.$input = this.$('.search');
    this.$list = this.$('.list')
    this.$stats = this.$('#stats_container')
    this.$loading = this.$('#loading_container');
    this.listenTo(app.Packages, 'sync', this.render );
    this.listenTo(app.Stats, 'sync', this.render );
  },

  render: function(arg) {
    this.$loading.hide();

    this.$list.empty();
    var that = this;

    // render packages
    app.Packages.forEach(function(pkg) {
      if (pkg.get('deprecated')) return;
      var pkg_view = new app.PackageView({ model: pkg });
      pkg_view.render();
      that.$list.append( pkg_view.$el );

    });

    var options = {
        valueNames: [ 'engine', 'votes','downloads', 'name', 'keywords', 'group', 'description', 'maintainers' ]
    };

    this.list = new List('app', options);

    // render stats
    app.Stats.forEach(function(stat) {

      if (stat.get('variety') === "author"){
        var view = new app.AuthorStatView({ model: stat });
      } else {
        var view = new app.PackageStatView({ model: stat });
      }
      
      view.render();
      that.$stats.append( view.$el );

    });

  },

  instantSearch: function( event ) {
    $('.searchfield').removeHighlight(); 
    $('.searchfield').highlight( this.$input.val() );
  }

});
