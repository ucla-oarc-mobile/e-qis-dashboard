module.exports = CollectPrompt = Backbone.Model.extend({
  defaults: {
    id:           '',
    displayLabel: '',
    promptText:   '',
    promptType:   '',
    condition:    '',
    skippable:    false,
    skipLabel:    '',
    inputType:    '',
    custom:       false,
    properties:   {},
    skipped:      false,
    displayed:    true
  },
  getSubmitValue: function() {
    var value = this.view.val();

    if (this.get('promptType') === 'single_choice_custom') {
      // If the choice was a valid pre-defined choice, return the value rather than the choice index
      if (_.has(this.get('properties'), value)) {
        value = this.get('properties')[value];
      }
    }

    else if (this.get('promptType').substr(0, 12) === 'multi_choice') {
      // Multi-choice prompts expect arrays
      value = _.isArray(value) ? value : [value];

      if (this.get('promptType') === 'multi_choice_custom') {
        // Replace choice indexes with values for any pre-defined choices
        value = _.map(value, function(a) {
          if (_.has(this.get('properties'), a)) {
            return this.get('properties')[a];
          }
          else {
            return a;
          }
        }.bind(this));
      }
    }

    return value;
  },
  invalidMessage: function() {
    var val = this.view.val();

    // If the prompt has a value, it's valid (there is no message)
    // (we have to manually check for zero, which is still a valid value!)
    if (val || val === 0) {
      return '';
    }

    switch(this.get('promptType')) {
      case 'document':
        return 'Please select a document.';

      case 'photo':
        return 'Please take an image to submit.';

      case 'multi_choice':
      case 'multi_choice_custom':
      case 'single_choice':
      case 'single_choice_custom':
        return 'Please select an option.';

      default:
        return 'Please enter a response.';
    }
  }
});
