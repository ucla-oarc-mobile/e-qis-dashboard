module.exports = SummaryCount = Backbone.Model.extend({
  initialize: function(model, options) {
    results = options.results;
    console.log('summaryCount results option', results);
    this.listenTo(results, "refresh", function(results) {
      console.log('summaryCount refresh listener', results);
    });
  }
});
