var app = require('../../app');
var oh = require('../../oh');

var CollectPrompt = require('./prompt');
var CollectHistory = require('./history');

module.exports = CollectPrompts = Backbone.Collection.extend({
  model: CollectPrompt,
  initialize: function(params) {
    this.campaignUrn = params.campaignUrn;
    this.surveyId    = params.surveyId;
    this.dayFolder   = params.dayFolder;
    this.surveyKey   = params.surveyKey;
    this.editMode    = params.surveyKey ? true : false;

    oh.campaign.readall({
      output_format: 'long',
      campaign_urn_list: this.campaignUrn
    }).done(function(data) {
      // Remember when the campaign was created, needed for submission
      this.campaignCreation = data[this.campaignUrn].creation_timestamp;

      // Crunch XML into a more sensible set of objects
      this.prompts = this.parseXml(data[this.campaignUrn].xml);

      // Create a new history object and finish initialization when it's ready
      this.history = new CollectHistory({
        prompts:     this.prompts,
        campaignUrn: this.campaignUrn,
        surveyId:    this.surveyId,
        surveyKey:   this.surveyKey
      });
      this.listenTo(this.history, 'history:ready', this.copyValuesFromHistory);
      this.history.load();
    }.bind(this));
  },
  parseXml: function(xml) {
    var tree = $.parseXML(xml);

    var match = _.find($(tree).find('survey'), function(survey) {
      return $(survey).find('> id').text() === this.surveyId;
    }.bind(this));

    this.title       = $(match).find('> title'      ).text();
    this.description = $(match).find('> description').text();
    this.submitText  = $(match).find('> submitText' ).text();

    if (this.dayFolder) {
      this.title += ' | Day ' + this.dayFolder;
    }

    var prompts = _.map($(match).find('prompt'), function(prompt) {
      var properties = {};

      $(prompt).find('> properties > property').each(function() {
        properties[$(this).find('> key').text()] = $(this).find('> label').text();
      });

      var attributes = {
        id:           $(prompt).find('> id'          ).text(),
        displayLabel: $(prompt).find('> displayLabel').text(),
        promptText:   $(prompt).find('> promptText'  ).text(),
        promptType:   $(prompt).find('> promptType'  ).text(),
        condition:    $(prompt).find('> condition'   ).text(),
        skippable:    $(prompt).find('> skippable'   ).text() === 'true',
        skipLabel:    $(prompt).find('> skipLabel'   ).text(),
        properties:   properties
      };

      if (/^single_choice/.test(attributes.promptType)) {
        attributes.inputType = 'radio';
      }
      else if (/^multi_choice/.test(attributes.promptType)) {
        attributes.inputType = 'checkbox';
      }
      attributes.custom = /_custom$/.test(attributes.promptType);

      return attributes;
    }.bind(this));

    return prompts;
  },
  copyValuesFromHistory: function() {
    // Copy each value from the history into the prompts collection
    _.each(this.prompts, function(prompt) {
      // If a day folder was given (for creating a new artifact), use it for those special prompts
      if (this.dayFolder && _.contains(['InstructionalArtifactDayFolder', 'AssessmentArtifactDayFolder'], prompt.id)) {
        prompt.value = this.dayFolder;
      }

      // If the prompt was not displayed earlier, blank it out now
      else if (this.history.getPromptValue(prompt.id) === 'NOT_DISPLAYED') {
        prompt.value = '';
      }

      // If the prompt was skipped, blank out the value but remember it was skipped
      else if (this.history.getPromptValue(prompt.id) === 'SKIPPED') {
        prompt.value = '';
        prompt.skipped = true;
      }

      // Otherwise, use the value from the history
      else {
        prompt.value = this.history.getPromptValue(prompt.id);
      }
    }.bind(this));

    this.reset(this.prompts);
  },
  getChangedResponses: function() {
    this.changedResponses = [];
    this.uploadedFiles = {};

    this.each(function(prompt) {
      var id = prompt.get('id');
      var submitValue = prompt.getSubmitValue();

      // Only add the prompt value if it's different from the history value
      if (this.history.diff(prompt.get('id'), submitValue)) {
        this.changedResponses.push({ prompt_id: id, value: submitValue });

        // Also add to the files hash if it's a file type prompt
        var file = prompt.get('file');
        if (submitValue && file) {
          this.uploadedFiles[submitValue] = file;
        }
      }
    }.bind(this));
  },
  post: function() {
    // Get only responses and files that are new and need recording
    this.getChangedResponses();

    // If creating a new artifact, generate a new survey key
    if (!this.editMode) {
      this.surveyKey = app.guid();
    }

    var params = {
      campaign_urn: this.campaignUrn,
      campaign_creation_timestamp: this.campaignCreation,
      private_state: 'shared',
      update: this.editMode,
      surveys: JSON.stringify([{
        survey_key: this.surveyKey,
        time: Date.now(),
        timezone: 'America/Los_Angeles',
        location_status: 'unavailable',
        survey_id: this.surveyId,
        survey_launch_context: {
          launch_time: Date.now(),
          launch_timezone: 'America/Los_Angeles',
          active_triggers: []
        },
        responses: this.changedResponses
      }])
    };

    // Add new uploaded files
    _.each(this.uploadedFiles, function(file, guid) {
      params[guid] = file;
    });

    oh.callform('/survey/upload', params).done(function() {
      this.trigger('submit:success');
    }.bind(this)).error(function(message) {
      this.trigger('submit:error', message);
    }.bind(this));
  }
});
