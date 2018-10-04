var CollectArtifactView = require('./artifact');

module.exports = CollectEditView = Backbone.View.extend({
  el: '#content',
  template: JST['templates/collect/edit.html'],
  initialize: function(params) {
    this.artifact = new CollectArtifactView({
      campaignUrn: params.portfolio,
      surveyId:    params.folder,
      surveyKey:   params.artifact
    });
  },
  render: function() {
    this.$el.html(this.template);
    this.$('#edit-artifact').html(this.artifact.render().$el);

    return this;
  }
});
