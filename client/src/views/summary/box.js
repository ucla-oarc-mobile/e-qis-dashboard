module.exports = SummaryBoxView = Marionette.ItemView.extend({
  tagName: "aside",
  attributes: {
    "id": "summary-box",
    "class": "pull-right summary-box"
  },
  template: _.template('<hgroup> <h4 class="no-bottom">Summary</h4><hr class="no-margin"> </hgroup> <p>Total Teachers: <%= teachersCount %></p> <p>Total Portfolios: <%= portfoliosCount %></p>'),
  modelEvents: {
    "refresh": "render"
  }
});
