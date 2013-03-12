  // js/collections/todos.js

  var app = app || {};

  // Package Collection
  // ---------------

  var PackageList = Backbone.Collection.extend({

    url: function() {
      return '/pkgs/';
    } ,

    // Reference to this collection's model.
    model: app.Package,
    query: "",

    parse : function(resp) {
      return resp.content;
    },

    search: function(query) {

      this.query = query;
      this.fetch();

    }

  });

  app.Packages = new PackageList();