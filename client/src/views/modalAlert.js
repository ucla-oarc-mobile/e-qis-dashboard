var modalAlertTemplate = JST['templates/modalAlert.html'];

module.exports = modalAlertView = Backbone.View.extend({
  el: '#modalContent',
  template: modalAlertTemplate,
  initialize: function(msg){
    this.msg = msg;
  },
  render: function () {
    this.$el.html(this.template());
    $("#modalBody").html(this.msg);
    return this;
  },
});
