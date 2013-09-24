var app = app || {};

var StatsList = Backbone.Collection.extend({

  url: function() {
    return '/stats';
  } ,

  model: app.Stat,

  parse : function(resp) {
    return resp.content;
  }

});

app.Stats = new StatsList();
