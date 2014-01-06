
var app = app || {};

app.PackageStatView = Backbone.View.extend({

  tagName: 'div',

  className: 'stat',

  template: _.template( $('#package-stat-template').html() ),

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

  initialize: function() {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function() {
    
		this.$el.html( this.template( this.model.toJSON() ) );
    return this;
    
  }

});
