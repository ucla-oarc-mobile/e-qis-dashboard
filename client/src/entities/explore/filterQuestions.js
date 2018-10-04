var app = require('../../app');

var oh = require('../../oh');

module.exports = ExploreQuestions = Backbone.Collection.extend({
  model: Backbone.Model,
  parse: function(xml, options) {
    // assume that xml is an ohmage campaign XML string.

    var tree = $.parseXML(xml),
      surveys = '',
      results = [{
        surveyId: '',
        label: 'All Questions',
        value: ''
      }];

    surveys = $(tree).find('survey');

    _.each(surveys, function(survey) {
      // save the ID so it can be used as a meta property on the question.
      var surveyId = $(survey).find('> id').text();
      var myPrompts = $(survey).find('prompt');
      var blacklist = app.config.responseBlacklist[surveyId];

      // Add prompts unless they are blacklisted
      _.each(myPrompts, function(prompt) {
        var promptId = $(prompt).find('> id').text();
        if (!_.contains(blacklist, promptId)) {
          results.push({
            surveyId: surveyId,
            label: $(prompt).find('> promptText').text(),
            value: promptId
          });
        }
      });
    });

    return results;
  },
  initialize: function(models, options) {
    // immediately fetch a list of user question XML on init
    oh.campaign.readall({ output_format: 'xml', campaign_urn_list: 'urn:campaign:tpp:internal:eqissurveys6' }).done(function(data) {
      this.reset(data, {parse: true});
    }.bind(this));

  }
});
