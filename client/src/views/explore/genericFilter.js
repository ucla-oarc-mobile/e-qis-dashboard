var ExploreFiltersDropdown = Marionette.ItemView.extend({
  tagName: "option",
  template: _.template('<%= label %>'),
  attributes: function() { return { value: this.model.get('value') }; }
});

module.exports = GenericFilterView = Marionette.CollectionView.extend({

  // custom method to generate a custom view options hash

  // custom options (required):
  // attributeName - HTML name attribute
  // defaultLabel - the default label
  // customEvent - custom change event to fire

  tagName: "select",
  className: "form-control",
  childView: ExploreFiltersDropdown,
  attributes: function() {
    return {
      name: this.getOption('attributeName')
    };
  },
  initialize: function(options) {
    options.collection.add([{value: "", label: this.getOption('defaultLabel')}], {at: 0});
    this.collection = options.collection;
  },
  triggers: function() {
    return {
      "change": this.getOption('customEvent')
    };
  },
});
