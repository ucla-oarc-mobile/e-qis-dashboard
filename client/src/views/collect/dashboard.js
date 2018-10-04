var app = require('../../app');
var oh = require('../../oh');

var CollectFolderView = require('./folder');
var CollectFolders = require('../../entities/collect/folders');

module.exports = CollectDashboardView = Backbone.View.extend({
  el: '#content',
  template: JST['templates/collect/dashboard.html'],
  optionTemplate: _.template('<option value="<%= value %>"><%= text %></option>'),
  events: {
    'change #select-portfolio': 'selectPortfolio',
    'click .collect-button': 'collectArtifact'
  },
  initialize: function(portfolio) {
    // Allow portfolio to be selected from URL
    this.portfolio = portfolio;
  },
  render: function() {
    this.$el.html(this.template);

    // Generate list of whitelisted portfolios, sorted by display name
    var portfolios = _.pairs(app.user.get('campaigns'));
    portfolios = _.filter(portfolios, function(a) { return _.contains(app.config.portfolioWhitelist, a[0]); });
    portfolios = _.sortBy(portfolios, function(a) { return a[1]; });

    // Add portfolios to dropdown
    _.each(portfolios, function(portfolio) {
      this.$('#select-portfolio').append(this.optionTemplate({ value: portfolio[0], text: portfolio[1] }));
    }.bind(this));

    // Auto-select portfolio if one was passed through the URL
    if (this.portfolio) {
      this.$('#select-portfolio').val(this.portfolio).trigger('change');
    }

    return this;
  },
  addOne: function(folder) {
    var view = new CollectFolderView({ model: folder });
    var item = view.render().$el;
    this.$('.folder-list').append(item);
  },
  addAll: function() {
    this.$('.collect-folders').show();
    this.$('.folder-list').empty();
    this.collectFolders.each(this.addOne, this);
  },
  selectPortfolio: function() {
    this.portfolio = this.$('#select-portfolio').val();
    this.collectFolders = new CollectFolders(this.portfolio);
    this.listenTo(this.collectFolders, 'reset', this.addAll);

    // Update URL to reflect new portfolio
    app.router.navigate('collect/' + this.portfolio, { replace: true });
  },
  collectArtifact: function(e) {
    var surveyId = $(e.target).data('survey');
    var day = $(e.target).data('day');

    this.$('.collect-dashboard').hide();
    var artifact = new CollectArtifactView({
      campaignUrn: this.portfolio,
      surveyId:    surveyId,
      dayFolder:   day
    });
    this.$('.collect-dashboard').last().after(artifact.render().$el);
  }
});
