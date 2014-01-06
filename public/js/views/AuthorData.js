
var app = app || {};

app.AuthorDataView = Backbone.View.extend({

  el: '#data',

  template: _.template( $('#author-data-template').html() ),
	
	events: {
		'click .package-link' : 'packageClick',
		'click .author-link': 'authorClick'
	},
		
	packageClick: function(e){
		var id = $(e.target).attr('pkg-data-id');
		app.currentData.getPackage(id); 		

	},

	authorClick: function(e){
		var id = $(e.target).attr('author-data-id');
		app.currentData.getAuthor(id); 		

	},

  initialize: function( options ) {
    this.model = options.model;
  },

  render: function() {
    this.$el.html( this.template( this.model.toJSON() ) );
    return this;
  }

});
