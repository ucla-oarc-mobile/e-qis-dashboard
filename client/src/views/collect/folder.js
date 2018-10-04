module.exports = CollectFolderView = Backbone.View.extend({
  tagName: 'tr',
  template: JST['templates/collect/folder.html'],
  initialButton: JST['templates/collect/initialButton.html'],
  concludingButton: JST['templates/collect/concludingButton.html'],
  dayButtons: JST['templates/collect/dayButtons.html'],
  render: function() {
    var attributes = this.model.attributes;

    if (attributes.survey === '1InitialReflection') {
      attributes.buttons = this.initialButton(attributes);
    } else if (attributes.survey === '4ConcludingReflection') {
      attributes.buttons = this.concludingButton(attributes);
    } else {
      attributes.buttons = this.dayButtons(attributes);
    }

    this.$el.html(this.template(attributes));

    return this;
  }
});
