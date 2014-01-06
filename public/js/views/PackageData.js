
var app = app || {};

app.PackageDataView = Backbone.View.extend({

  el: '#data',

  template: _.template( $('#package-data-template').html() ),

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
  	console.log(this.model.toJSON() );
	  this.$el.html( this.template( this.model.toJSON() ) );
    return this;
  }

});
