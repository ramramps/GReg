var app = app || {};



var StatsList = Backbone.Collection.extend({

  url: function() {
    return '/stats?limit=8';
  } ,

  model: app.Stat,

  parse : function(resp) { 
    return resp.content;
  }

});

app.Stats = new StatsList();
