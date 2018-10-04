var SummaryTableRow = Backbone.Model.extend({
  defaults: {
    initialCount: 0,
    assessmentCount: 0,
    instructionCount: 0,
    concludingCount: 0,
    totalCount: 0
  }
});

module.exports = SummaryTable = Backbone.Collection.extend({
  initialize: function(models, options) {
    results = options.results;
    console.log('summaryTable results option', results);
    this.listenTo( results, "refresh", function(results) {
      console.log('summaryTables refresh listener', results.toJSON());
      // just populate with the base results and zero
      // fill empty counts for now, ready for additional
      // parsing / filtering if needed.
      this.reset(results.toJSON());
    });
  },
  model: SummaryTableRow
});
