var app = require('../app');
var userIndexTemplate = JST['templates/userIndex.html'];
var userSummaryTemplate = JST['templates/userSummary.html'];

var UserSummaryView = Backbone.View.extend({
  events: {
    "click td": "goTo"
  },
  tagName: 'tr',
  template: userSummaryTemplate,
  render: function () {
    this.$el.html(this.template(this.model.attributes));

    return this;
  },
  goTo: function () {
    window.location = "#user/" + this.model.attributes.username;

  }
});

module.exports = UserIndexView = Backbone.View.extend({
  el: '#content',
  template: userIndexTemplate,
  render: function () {
    this.listenTo(this.collection, 'reset', this.addAll);
    this.$el.html(this.template);

    return this;
  },
  addOne: function (user) {
    var view = new UserSummaryView({model: user});
    this.$('tbody').append(view.render().el);
  },
  addAll: function () {
    $("#users tbody tr").remove();
    this.collection.each(this.addOne, this);
  }
});
