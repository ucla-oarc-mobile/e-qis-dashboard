module.exports = SummaryDropdown = Backbone.Model.extend({
  parse: function(data, options) {
    if (_.isArray(data)) {
      return {value: data[0], label: data[1] };
    } else {
      return {value: data, label: data };
    }
  }
});
