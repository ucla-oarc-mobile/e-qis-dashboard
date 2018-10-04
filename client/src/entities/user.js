var app = require('../app');

module.exports = User = Backbone.Model.extend({
  defaults: {
    username:      '',
    first_name:    '',
    last_name:     '',
    email_address: '',
    password: '',
    personal_id: '',
  },
  determineStatus: function() {
    if (this.get('class_roles')) {
      // Logged-in user has their status in class_roles
      return this.get('class_roles')[0];
    }
    else if (app.classInfo) {
      // Other users store this info in the class data
      return app.classInfo.users[this.get('username')];
    }
  },
  determineRole: function() {
    if (this.get('permissions').can_setup_users) {
      return 'admin';
    }
    else if (this.get('status') === 'privileged') {
      return 'evaluator';
    }
    else {
      return 'teacher';
    }
  },
  initialize: function() {
    // Determine status if it wasn't initialized
    if (!this.get('status')) {
      this.set('status', this.determineStatus());
    }

    // Determine role if it wasn't initialized
    if (!this.get('role')) {
      this.set('role', this.determineRole());
    }
  }
});
