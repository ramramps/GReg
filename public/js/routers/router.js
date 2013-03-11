// js/routers/router.js

  // Package Router
  // ----------

  var Workspace = Backbone.Router.extend({

    routes:{
      '*filter': 'setFilter'
    },

    setFilter: function( param ) {
      // Set the current filter to be used
      app.PackageFilter = param.trim() || '';
    }

  });

  app.PackageRouter = new Workspace();
  Backbone.history.start();