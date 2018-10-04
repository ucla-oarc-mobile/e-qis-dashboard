var modalTemplate = JST['templates/modal.html'];

module.exports = modalView = Backbone.View.extend({
  el: '#modalContainer',
  template: modalTemplate,
  events: {
    'click #saveUser': 'createUser',
  },
  render: function () {
    this.$el.html(this.template());
    return this;
  },
});
