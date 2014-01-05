
var app = app || {};

app.AuthorDataView = Backbone.View.extend({

  el: '#data',

  template: _.template( $('#author-data-template').html() ),

  initialize: function( options ) {
    this.model = options.model;
  },

  render: function() {

    this.$el.html( this.template( this.model.toJSON() ) );
    return this;

  }

});
