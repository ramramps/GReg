
var app = app || {};

app.PackageDataView = Backbone.View.extend({

  el: '#data',

  template: _.template( $('#package-data-template').html() ),

  initialize: function() {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function() {

    this.$el.html( this.template( this.model.toJSON() ) );
    return this;

  }

});
