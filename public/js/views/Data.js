
var app = app || {};

app.DataView = Backbone.View.extend({

  el: '#data_container',

  events: {
		// when exit button clicked, make the needed updates
		'click .exit-data' : 'exit'	
  },

  initialize: function() { 
 		this.model = new app.Data();
		app.currentData = this.model;
    this.listenTo(this.model, 'change', this.render );		
			
		// for debugging
		this.model.getAuthor('51f8232fe2f476ca05000003');
	},

	exit: function(){
		this.$el.hide();
		
		// set the bottom property of the browse container
		$('#browse_container').css('bottom', 0);
	
   },

  render: function() {
	
		if ( !this.model.get('current_model') ) return;
			
		if (this.model.get('current_type') === "package"){
			var view = new app.PackageDataView( { model: this.model.get('current_model') } );
			view.render();
		} else {
			var view = new app.AuthorDataView( { model: this.model.get('current_model') } );
			view.render();		
		}	
		
		return this;

  }

});
