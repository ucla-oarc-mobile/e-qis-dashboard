var modalWaitTemplate = JST['templates/modalWait.html'];

module.exports = modalWaitView = Backbone.View.extend({
  el: '#modalContent',
  template: modalWaitTemplate,
  initialize: function(msg) {
    this.msg = msg || 'Please wait...';
  },
  render: function() {
    this.$el.html(this.template({ message: this.msg }));
    return this;
  }
});
