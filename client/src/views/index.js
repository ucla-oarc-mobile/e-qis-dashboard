var app = require('../app');

module.exports = IndexView = Backbone.View.extend({
  el: '#content',
  indexTemplate: _.template('<div id="index" class="text-center"></div>'),
  itemTemplate: _.template('<div class="item"><a href="<%= href %>"><img src="<%= image %>"></a><h3><%= heading %></h3><p><%= description %></p></div>'),
  render: function() {
    this.$el.html(this.indexTemplate);

    if (app.user.get('role') === 'evaluator' || app.user.get('role') === 'admin') {
      this.$('#index').append(this.itemTemplate({ href: '#portfolios', image: 'images/review.png', heading: 'Review', description: 'Review instructor portfolios' }));
      this.$('#index').append(this.itemTemplate({ href: '#explore', image: 'images/explore.png', heading: 'Explore', description: 'Query portfolio details' }));
      this.$('#index').append(this.itemTemplate({ href: '#summary', image: 'images/summary.png', heading: 'Summary', description: 'View summary data' }));
    }

    else {
      this.$('#index').append(this.itemTemplate({ href: '#explore', image: 'images/explore.png', heading: 'Explore', description: 'Query portfolio details' }));
      this.$('#index').append(this.itemTemplate({ href: '#my-portfolio', image: 'images/my-portfolio.png', heading: 'My Portfolio', description: 'View portfolio(s)' }));
      this.$('#index').append(this.itemTemplate({ href: '#collect', image: 'images/collect.png', heading: 'Collect', description: 'Collect data' }));
    }

    return this;
  }
});
