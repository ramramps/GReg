 // js/views/app.js

  var app = app || {};

  // The Application
  // ---------------

  app.AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: '#search_container',

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      'keyup .search': 'instantSearch'
    },

    initialize: function() { 

      this.$input = this.$('.search');
      this.$list = this.$('.list')
      this.listenTo(app.Packages, 'sync', this.render );

    },

    render: function(arg) {

      this.$list.empty();
      var that = this;

      app.Packages.forEach(function(pkg) {

        var pkg_view = new app.PackageView({ model: pkg });
        pkg_view.render();
        that.$list.append( pkg_view.$el );

      });

      var options = {
          valueNames: [ 'engine', 'name', 'keywords', 'group', 'description', 'maintainers' ]
      };

      this.list = new List('search_container', options);

    },

    instantSearch: function( event ) {

      $('.searchfield').removeHighlight(); 
      $('.searchfield').highlight( this.$input.val() );

    }

  });
