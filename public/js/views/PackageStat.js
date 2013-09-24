
var app = app || {};

app.PackageStatView = Backbone.View.extend({

  tagName: 'div',

  className: 'stat',

  template: _.template( $('#package-stat-template').html() ),

  events: {

  },

  initialize: function() {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function() {
    
		this.$el.html( this.template( this.model.toJSON() ) );
    return this;
    
  }

});
