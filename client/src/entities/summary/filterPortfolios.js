var SummaryDropdown = require('./filterDropdown');

module.exports = SummaryPortfolios = Backbone.Collection.extend({
  model: SummaryDropdown,
  parse: function(data, options) {
    // List of whitelisted portfolios, sorted by display name
    var portfolios = _.pairs(data);
    portfolios = _.filter(portfolios, function(a) { return _.contains(app.config.portfolioWhitelist, a[0]); });
    portfolios = _.sortBy(portfolios, function(a) { return a[1]; });
    return portfolios;
  }
});
