var app = require('../../app');

var SummaryDropdown = require('./filterDropdown');

module.exports = SummaryTeachers = Backbone.Collection.extend({
  model: SummaryDropdown,
  parse: function(data, options) {
    var teachers = _.pairs(data);
    teachers = _.filter(teachers, function(a) { return a[1] === 'restricted'; });

    if (teachers.length === 0) {
      // there are no matching results, just return the current user
      return [app.user.get('username')];
    }

    teachers = _.map(teachers, function(a) { return a[0]; });
    teachers.sort();
    return teachers;
  }
});
