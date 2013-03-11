 // js/view/packages.js

  var app = app || {};

  // Package Item View
  // --------------

  app.PackageView = Backbone.View.extend({

    tagName: 'li',

    template: _.template( $('#item-template').html() ),

    events: {
      // 'click .toggle': 'togglecompleted', // NEW
    },

    initialize: function() {

      this.listenTo(this.model, 'change', this.render);

    },

    render: function() {

      this.$el.html( this.template( this.model.toJSON() ) );
      return this;
      
    }

  });