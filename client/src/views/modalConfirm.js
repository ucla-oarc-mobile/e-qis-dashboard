var modalConfirmTemplate = JST['templates/modalConfirm.html'];

module.exports = modalConfirmView = Backbone.View.extend({
  el: '#modalContent',
  template: modalConfirmTemplate,
  initialize: function(msg,callback){
    this.msg = msg;
    this.callback = callback;
  },
  events:{
    'click #okay': 'okay',
    'click #cancel': 'cancel',
  },
  okay: function(){
    this.callback(true);
  },
  cancel: function(){
    this.callback(false);
  },
  render: function () {
    this.$el.html(this.template());
    $("#modalTitle").html(this.msg);
    return this;
  },
});
