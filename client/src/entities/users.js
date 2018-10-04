var User = require('./user');
var oh = require('../oh');
var app = require('../app');

module.exports = Users = Backbone.Collection.extend({
  model: User,
  comparator: function(a, b) {
    // Default sort alphabetically by username
    return a.get('username') > b.get('username') ? 1 : -1;
  },
  initialize: function() {
    var self = this;

    oh.user.read({ class_urn_list: app.classInfo.urn }).done(function(userData) {
      self.reset(_.map(userData, function(user, username) {
        return _.extend(user, { username: username });
      }));
    });
  }
});
