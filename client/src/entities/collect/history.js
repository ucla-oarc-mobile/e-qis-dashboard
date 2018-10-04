var app = require('../../app');
var oh = require('../../oh');

module.exports = CollectHistory = Backbone.Model.extend({
  initialize: function(params) {
    this.campaignUrn = params.campaignUrn;
    this.surveyId    = params.surveyId;
    this.surveyKey   = params.surveyKey;

    // Initialize with an empty history of key/value pairs for each prompt
    // Keys are prompt IDs and values are blank for now
    var prompts = {};
    _.each(params.prompts, function(a) { prompts[a.id] = ''; }.bind(this));
    this.set('prompts', prompts);
  },
  load: function() {
    // If a survey key was given, load the responses from the server
    if (this.surveyKey) {
      oh.response.read_custom({
        campaign_urn:            this.campaignUrn,
        survey_response_id_list: this.surveyKey
      }).done(function(surveyData) {
        var prompts = this.get('prompts');

        // Turn the response into key/value pairs
        _.each(surveyData[0].responses, function(val, key) {
          prompts[key] = val.prompt_response;
        }.bind(this));

        this.set('prompts', prompts);
        this.trigger('history:ready');
      }.bind(this));
    }

    // Otherwise just return the default empty history
    else {
      this.trigger('history:ready');
    }
  },
  getPromptValue: function(id) {
    // Just a shortcut to grab a particular prompt value by its id
    return this.get('prompts')[id];
  },
  diff: function(id, value) {
    // Returns true if the history value is different from the given value
    var thisValue = this.getPromptValue(id);

    // Arrays have to be sorted before _.isEqual will work properly
    // (but at least isEqual does deep comparison, so that's nice)
    if (_.isArray(thisValue) && _.isArray(value)) {
      thisValue.sort();
      value.sort();
    }

    return !_.isEqual(thisValue, value);
  }
});
