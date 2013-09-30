var app = app || {};



var StatsList = Backbone.Collection.extend({

  url: function() {
    return '/stats';
  } ,

  model: app.Stat,

  parse : function(resp) {
   
		console.log(resp.content);
    return resp.content;
  }

});

app.Stats = new StatsList();
