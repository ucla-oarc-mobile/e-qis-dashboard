var app = require('../../app');

var CollectPrompts = require('../../entities/collect/prompts');
var CollectPromptView = require('./prompt');

module.exports = CollectArtifactView = Backbone.View.extend({
  tagName: 'div',
  className: 'row collect-artifact',
  template: JST['templates/collect/artifact.html'],
  events: {
    'click .collect-back': 'back',
    'click .collect-next': 'next',
    'click .collect-submit': 'submitResponse',
    'click .collect-done': 'backToOrigin'
  },
  initialize: function(params) {
    this.page     = 0;
    this.values   = {};
    this.editMode = params.surveyKey ? true : false;

    // This will read the XML for the campaign and make prompt objects out of it
    this.prompts = new CollectPrompts({
      campaignUrn: params.campaignUrn,
      surveyId:    params.surveyId,
      dayFolder:   params.dayFolder,
      surveyKey:   params.surveyKey
    });

    // Listen to submit success/failure so the view can update
    this.listenTo(this.prompts, 'submit:success', this.submitSuccess);
    this.listenTo(this.prompts, 'submit:error',   this.submitError  );
  },
  render: function() {
    this.$el.html(this.template);
    this.listenTo(this.prompts, 'reset', this.addAll);

    return this;
  },
  addOne: function(prompt) {
    var view = new CollectPromptView({ model: prompt, editMode: this.editMode });
    var item = view.render().$el;

    // If the prompt has a condition, start adding to the bucket instead
    if (prompt.get('condition')) {
      this.addPage = 'bucket';
      this.addTo = this.$('.prompt-bucket');
    }

    prompt.set('page', this.addPage);
    item.appendTo(this.addTo);
  },
  addAll: function() {
    this.$('.collect-title').text(this.prompts.title);
    this.$('.collect-description').text(this.prompts.description);
    this.$('.prompt-submit-text').text(this.prompts.submitText);

    this.addTo = this.$('.prompt-list');
    this.addPage = 0;

    this.prompts.each(this.addOne, this);
  },
  back: function() {
    // Hide the submit stuff in case it's displayed
    this.$('.prompt-submit-text, .collect-submit').hide();
    this.$('.collect-next').show();

    // If we're at the first page, go back to where the user came from
    if (this.page === 0) {
      window.confirm('Data from your current artifact response will be lost. Do you want to exit the artifact?', function(exit) {
        if (exit) {
          this.backToOrigin();
        }
      }.bind(this));
    }

    // Otherwise, show the previous page
    else {
      // Put the current page's prompts back into the bucket
      _.each(this.prompts.where({ page: this.page }), function(prompt) {
        prompt.set('page', 'bucket');
        prompt.set('displayed', true);
        prompt.view.$el.show().prependTo(this.$('.prompt-bucket'));
        delete this.values[prompt.get('id')];
      }.bind(this));

      // Show the previous page prompts
      this.page--;
      _.each(this.prompts.where({ page: this.page }), function(prompt) {
        if (prompt.get('displayed')) {
          prompt.view.$el.show();
        }
      }.bind(this));
    }
  },
  next: function() {
    // Validate all prompts on the current page
    var invalid = 0;
    _.each(this.prompts.where({ page: this.page }), function(prompt) {
      var message = prompt.invalidMessage();
      prompt.view.$el.toggleClass('invalid', message ? true : false);
      prompt.view.$('.invalid-message').text(message);
      if (message) {
        invalid++;
      }
    });

    if (invalid > 0) {
      var message = '';
      if (invalid > 1) {
        message = 'There are ' + invalid + ' invalid or incomplete responses on this page.';
      }
      else {
        message = 'This page contains either an invalid or incomplete response.';
      }
      message += ' Please resolve before continuing.';
      window.alert(message);
      return;
    }

    // Hide current page prompts, and record their values
    _.each(this.prompts.where({ page: this.page }), function(prompt) {
      prompt.view.$el.hide();
      this.values[prompt.get('id')] = prompt.view.val();
    }.bind(this));
    this.page++;

    // Add prompts from the bucket until empty or a branching point is reached
    var nextPrompt = this.prompts.findWhere({ page: 'bucket' });
    var newPrompts = false;

    while (nextPrompt) {
      var display = true;

      if (nextPrompt.get('condition')) {
        display = ConditionalParser.parse(nextPrompt.get('condition'), this.values);
      }

      // An undefined condition result means we don't have enough information
      // to decide to show the prompt or not (i.e. a branching point)
      if (typeof display === 'undefined') {
        break;
      }

      if (display) {
        newPrompts = true;
      }
      else {
        nextPrompt.set('displayed', false);
        this.values[nextPrompt.get('id')] = 'NOT_DISPLAYED';
        nextPrompt.view.$el.hide();
      }

      nextPrompt.set('page', this.page);
      nextPrompt.view.$el.appendTo(this.$('.prompt-list'));

      nextPrompt = this.prompts.findWhere({ page: 'bucket' });
    }

    // If no new prompts were displayed, show the submission page
    if (!newPrompts) {
      this.$('.prompt-submit-text, .collect-submit').show();
      this.$('.collect-next').hide();
    }
  },
  submitResponse: function() {
    window.wait('Submitting survey responses, please wait...');

    // Let the prompts collection handle submission
    this.prompts.post();
  },
  submitSuccess: function() {
    $('#modalPermanent').modal('hide');
    this.$('.collect-title').text('Artifact Complete');
    this.$('.prompt-submit-text, .collect-submit, .collect-back').hide();
    this.$('.prompt-success, .collect-done').show();
  },
  submitError: function(message) {
    window.alert(message);
  },
  backToOrigin: function() {
    // If the user came from an artifact (is editing it), take them back to it
    if (this.editMode) {
      history.back();
    }

    // Otherwise, take them back to the dashboard
    else {
      // Yet another hack, to get the folder stats to reflect the new artifact.
      // Don't shoot the developer, please.
      window.location.reload();
    }
  }
});
