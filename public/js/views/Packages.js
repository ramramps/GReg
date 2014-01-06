
var app = app || {};

app.PackagesView = Backbone.View.extend({

  el: '.list',

  events: {
    'keyup .search': 'instantSearch'
  },

  initialize: function() { 
    this.$input = this.$('.search');
    this.$list = this.$('.list')
    this.$loading = this.$('.loading_container');
    this.listenTo(app.Packages, 'sync', this.render );
  },

  render: function(arg) {
    this.$loading.hide();

    this.$list.empty();
    var that = this;
		
    app.Packages.forEach(function(pkg) {
      if (pkg.get('deprecated')) return;
      var pkg_view = new app.PackageView({ model: pkg });
      pkg_view.render();
      that.$el.append( pkg_view.$el );

    });

    var options = {
        valueNames: [ 'engine', 'votes','downloads', 'name', 'keywords', 'group', 'description', 'maintainers' ]
    };

    this.list = new List('app', options);
		this.list.sort('downloads', { asc:false });

  },

  instantSearch: function( event ) {
    $('.searchfield').removeHighlight(); 
    $('.searchfield').highlight( this.$input.val() );
  }

});
