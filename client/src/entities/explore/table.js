var ExploreTableRow = Backbone.Model.extend({
});

module.exports = ExploreTable = Backbone.Collection.extend({
  initialize: function(models, options) {
    results = options.results;
    console.log('exploreTable results option', results);
    this.listenTo( results, "refresh", function(results) {
      console.log('exploreTables refresh listener', results.toJSON());
      // just populate with the base results and zero
      // fill empty counts for now, ready for additional
      // parsing / filtering if needed.
      this.reset(results.toJSON());
    });
  },
  model: ExploreTableRow
});
