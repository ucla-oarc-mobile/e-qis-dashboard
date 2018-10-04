var app = require('../../app');

module.exports = CollectPromptView = Backbone.View.extend({
  tagName: 'div',
  className: 'prompt',
  template: JST['templates/collect/prompt.html'],
  inputTemplates: {
    document:             JST['templates/promptTypes/document.html'],
    multi_choice:         JST['templates/promptTypes/choices.html' ],
    multi_choice_custom:  JST['templates/promptTypes/choices.html' ],
    number:               JST['templates/promptTypes/number.html'  ],
    photo:                JST['templates/promptTypes/photo.html'   ],
    single_choice:        JST['templates/promptTypes/choices.html' ],
    single_choice_custom: JST['templates/promptTypes/choices.html' ],
    text:                 JST['templates/promptTypes/text.html'    ],
    video:                JST['templates/promptTypes/video.html'   ]
  },
  events: {
    'click .choice.custom': 'toggleCustomInput',
    'click .custom-close':  'hideCustomInput',
    'click .custom-create': 'clickCreateChoice',
    'click .custom-delete': 'deleteChoice',
    'click .skip input':    'skip',
    'change .add-file':     'addFile',
    'click .number-minus':  'numberMinus',
    'click .number-plus':   'numberPlus'
  },
  initialize: function(params) {
    params.model.view = this;
    this.editMode = params.editMode;
  },
  render: function() {
    // Select template for this input type through the inputTemplates hash above
    // (fall back to an error message if the template isn't found)
    var inputTemplate = this.inputTemplates[this.model.get('promptType')];
    inputTemplate = inputTemplate || JST['templates/promptTypes/unsupported.html'];

    // Render the generic stuff through this.template,
    // then the input-specific stuff through the selectTemplate helper function
    this.$el.html(this.template(this.model.attributes));
    this.$('.prompt-input').html(inputTemplate(this.model.attributes));

    // Remember next ID for custom choices if the type allows it
    if (this.model.get('custom')) {
      this.nextChoiceIndex = _.keys(this.model.get('properties')).length;
    }

    // If in edit mode, do extra prompt-specific logic to set up the answers
    if (this.editMode) {
      this.handleAnsweredPrompts();
    }

    return this;
  },
  handleAnsweredPrompts: function() {
    var value = this.model.get('value');

    // If the prompt was skipped, check the skip checkbox
    if (this.model.get('skipped')) {
      this.$('.skip input').prop('checked', true);
      this.$('.skipped').show();
      return;
    }

    // For single choice types, coerce scalar value into an array
    // so the multi choice logic can handle them automatically
    if (this.model.get('promptType').substr(0, 13) === 'single_choice') {
      value = [value];
    }

    switch (this.model.get('promptType')) {
      case 'document':
      case 'photo':
      case 'video':
        // For file types, set the GUID because that is the real value
        this.model.set('guid', value);
        break;

      case 'single_choice':
      case 'multi_choice':
        // Check all choices that were already selected
        // (value is an array of choice indexes)
        _.each(value, function(a) {
          this.$('input[value="' + a + '"]').prop('checked', true);
        }.bind(this));
        break;

      case 'single_choice_custom':
      case 'multi_choice_custom':
        // Check all choices that were already selected
        // (value is an array of choice labels)
        _.each(value, function(a) {
          // If the choice is not pre-defined, create it first
          if (this.$('input[data-label="' + a + '"]').length === 0) {
            this.createChoice(a);
          }

          this.$('input[data-label="' + a + '"]').prop('checked', true);
        }.bind(this));
        break;
    }
  },
  toggleCustomInput: function() {
    this.$('.custom-controls').toggle();
  },
  hideCustomInput: function() {
    this.$('.custom-controls').hide();
  },
  clickCreateChoice: function() {
    var choice = $.trim(this.$('.custom-input').val());

    if (choice) {
      this.createChoice(choice);
    }
  },
  createChoice: function(choice) {
    var dummy = this.$('.choice.dummy');

    // Clone the old dummy so we have a new one for more choices
    dummy.clone().insertAfter(dummy);

    var newId = dummy.find('input').attr('id').replace(/_dummy$/, '_' + this.nextChoiceIndex);
    dummy.find('input').attr('id', newId).val(choice).attr('data-label', choice);
    dummy.find('label').attr('for', newId).last().text(choice);
    dummy.removeClass('dummy');
    this.nextChoiceIndex++;
    this.$('.custom-input').val('');
  },
  deleteChoice: function(e) {
    $(e.target).closest('.choice').remove();
  },
  skip: function() {
    var skipped = this.$('.skip input').prop('checked');

    this.$('.skipped').toggle(skipped);
    this.model.set('skipped', skipped);
  },
  val: function() {
    if (this.model.get('skipped')) {
      return 'SKIPPED';
    }
    else if (!this.model.get('displayed')) {
      return 'NOT_DISPLAYED';
    }

    switch (this.model.get('promptType')) {
      case 'document':
      case 'photo':
      case 'video':
        return this.model.get('guid');

      case 'multi_choice':
      case 'multi_choice_custom':
        var values = this.$('input:checked').map(function() {
          return $(this).val();
        }).get();

        // Conditionals expect zero/one selected choices to be a scalar, not an array
        if (values.length === 0) {
          return undefined;
        }
        else if (values.length === 1) {
          return values[0];
        }
        else {
          return values;
        }
        break;

      case 'number':
        // Number values should be numeric
        if (this.model.get('properties').wholeNumber) {
          return parseInt(this.$('input').val());
        }
        else {
          return parseFloat(this.$('input').val());
        }
        break;

      case 'single_choice':
      case 'single_choice_custom':
        // If the choice is not custom, it's an index, so make it numeric
        var checked = this.$('input:checked');
        if (!checked.closest('.choice').hasClass('deletable')) {
          return parseInt(checked.val());
        }
        else {
          return checked.val();
        }
        break;

      case 'text':
        return this.$('textarea').val();
    }
  },
  addFile: function() {
    var files = this.$('.add-file').get(0).files;

    // If a file was attached to the input, hide any existing thumbnail
    if (files.length > 0) {
      this.$('.existing-thumbnail').hide();
      this.model.set('guid', app.guid());
      this.model.set('file', files[0]);
    }

    // Otherwise, assume the user wants to keep the existing file
    // (the file attribute doesn't need to be touched since the GUID isn't changing)
    else {
      this.$('.existing-thumbnail').show();
      this.model.set('guid', this.model.get('value'));
    }
  },
  numberMinus: function() {
    this.numberShift(false);
  },
  numberPlus: function() {
    this.numberShift(true);
  },
  numberShift: function(plus) {
    var val = parseInt(this.$('input').val()) || 0;
    var min = this.$('input').attr('min');
    var max = this.$('input').attr('max');
    var step = this.$('input').attr('step');

    if (step === 'any') {
      step = 1;
    }
    else {
      step = parseInt(step);
    }

    val += plus ? step : -step;

    if (min && val < min) {
      val = min;
    }
    if (max && val > max) {
      val = max;
    }

    this.$('input').val(val);
  }
});
