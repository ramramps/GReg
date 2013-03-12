 // js/view/packages.js

  var app = app || {};

  // Package Item View
  // --------------

  app.PackageView = Backbone.View.extend({

    tagName: 'div',

    className: 'package',

    template: _.template( $('#item-template').html() ),

    events: {
      'click .showdeps': 'toggleDeps', 
    },

    toggleDeps: function(event) {

      this.$('.deps-container').toggle();
      this.$('.full_deps-container').toggle();
      event.preventDefault();

    },

    initialize: function() {

      this.listenTo(this.model, 'change', this.render);

    },

    render: function() {

      this.$el.html( this.template( this.model.toJSON() ) );
      return this;
      
    }

  });