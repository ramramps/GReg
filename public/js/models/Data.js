var app = app || {};

app.Data = Backbone.Model.extend({

  defaults: {
    current_type: 'author',
    current_model: undefined,
		downloading: false
  },

	getAuthor: function(id){
			
			this.set('downloading', true );
			var model = new app.Author();
			model.urlRoot = '/user/' + id;
			var that = this;
			model.fetch({success: function(){
			
				that.set('current_type', 'author');
				that.set('current_model', model);
				that.set('downloading', false);	
	
			}});
	},

	getPackage: function(id){
				
			this.set('downloading', true );
			var model = new app.Package();
			model.urlRoot = '/package/' + id;
			var that = this;
			model.fetch({success: function(){
				
				that.set('current_type', 'package');
				that.set('current_model', model);
				that.set('downloading', false);	
	
			}});
	}

});

