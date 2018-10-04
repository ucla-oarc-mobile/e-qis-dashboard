var oh = require('../oh');
var app = require('../app');

module.exports = ForgotPasswordView = Backbone.View.extend({
  visibleToGuests: true,
  el: '#content',
  splashTemplate: _.template('<div class="row"><div id="splash" class="col-lg-6 col-lg-offset-3 col-md-8 col-md-offset-2"><div class="row"><div class="col-sm-8 col-sm-offset-2"><div class="panel panel-primary"><div class="panel-body"><h1 class="panel-title text-center">Password Recovery</h1><hr><form class="form-horizontal"></form></div></div></div></div><div class="text-center"><img class="splash-folder" src="images/splash-folder.png"></div></div></div>'),
  inputTemplate: _.template('<div class="form-group"><div class="col-xs-12"><input type="<%= type %>" class="form-control" id="<%= id %>" placeholder="<%= placeholder %>"></div></div>'),
  buttonTemplate: _.template('<div class="form-group text-center"><button type="button" class="btn btn-primary" id="<%= id %>"><%= text %></button></div>'),
  linkTemplate: _.template('<div class="text-center"><a class="small" href="<%= href %>"><%= text %></a></div>'),
  instructionsTemplate: _.template('<p class="small">Your username and e-mail address are required to reset your password. Enter this information below! If you did not provide an e-mail address when receiving your account, please contact your supervisor.</p>'),
  resetSuccessTemplate: _.template('<p class="small">A temporary password has been sent to your e-mail address. You must log in at <a href="#">TODO: link</a> first in order to change your password. Your temporary password will not work in this app.</p>'),
  events: {
    'click #reset': 'resetPassword',
    'keypress form': 'enterKey'
  },
  render: function() {
    this.$el.html(this.splashTemplate);
    this.$('form').append(this.instructionsTemplate);
    this.$('form').append(this.inputTemplate({ id: 'username', placeholder: 'Username (case sensitive)', type: 'text' }));
    this.$('form').append(this.inputTemplate({ id: 'email', placeholder: 'Email Address', type: 'email' }));
    this.$('form').append(this.buttonTemplate({ id: 'reset', text: 'Reset Password' }));
    this.$('form').after(this.linkTemplate({ href: '#login', text: 'Back to Login' }));

    return this;
  },
  resetPassword: function() {
    self = this;
    app.userIsAttemptingLogin = true;
    oh.user.reset_password({ username: this.$('#username').val(), email_address: this.$('#email').val() })
      .done(function() {
        self.$('form').html(self.resetSuccessTemplate);
        app.userIsAttemptingLogin = false;
      });
  },
  enterKey: function(e) {
    // Submit form on enter
    if (e.keyCode === 13) {
      this.resetPassword();
    }
  }
});
