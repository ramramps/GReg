var app = app || {};

app.Data = Backbone.Model.extend({

  defaults: {
    current_model: undefined,
		downloading: false
  },

	getAuthor: function(id){
			
			this.set('downloading', true );
			var model = new app.Author();
			model.urlRoot = '/user/' + id;
			var that = this;
			model.fetch({success: function(){
				that.set('downloading', false);	
				that.set('current_model', model);
			}});
	},

	getPackage: function(id){
				
			this.set('downloading', true );
			var model = new app.Package();
			model.urlRoot = '/package/' + id;
			var that = this;
			model.fetch({success: function(){
				that.set('downloading', false);	
				that.set('current_model', model);
			}});
	}

});

