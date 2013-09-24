var app = app || {};


  app.Stat = Backbone.Model.extend({

    idAttribute: "type",

    defaults: {
      variety: 'package'
      , type: 'most_installed_package'
      , list: ''
    }

  });
