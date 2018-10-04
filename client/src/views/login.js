var oh = require('../oh');
var app = require('../app');

module.exports = LoginView = Backbone.View.extend({
  visibleToGuests: true,
  el: '#content',
  splashTemplate: _.template('<div class="row"><div id="splash" class="col-lg-6 col-lg-offset-3 col-md-8 col-md-offset-2"><div class="row"><div class="col-sm-8 col-sm-offset-2"><div class="panel panel-primary"><div class="panel-body"><h1 class="panel-title text-center"><img src="images/user.png"> Login</h1><hr><form class="form-horizontal"></form></div></div></div></div><div class="text-center"><img class="splash-folder" src="images/splash-folder.png"></div></div></div>'),
  inputTemplate: _.template('<div class="form-group"><label for="<%= id %>" class="col-sm-3 control-label"><%= label %></label><div class="col-sm-7"><input type="<%= type %>" class="form-control" id="<%= id %>"></div></div>'),
  buttonTemplate: _.template('<div class="form-group text-center"><button type="button" class="btn btn-primary" id="<%= id %>"><%= text %></button></div>'),
  linkTemplate: _.template('<div class="text-center"><a class="small" href="<%= href %>"><%= text %></a></div>'),
  events: {
    'click #login': 'login',
    'keypress form': 'enterKey'
  },
  render: function() {
    this.$el.html(this.splashTemplate);
    this.$('form').append(this.inputTemplate({ id: 'username', label: 'Username', type: 'text' }));
    this.$('form').append(this.inputTemplate({ id: 'password', label: 'Password', type: 'password' }));
    this.$('form').append(this.buttonTemplate({ id: 'login', text: 'Submit' }));
    this.$('form').after(this.linkTemplate({ href: '#forgot', text: 'Forgot Password?' }));

    return this;
  },
  login: function() {
    var username = this.$('#username').val();
    var password = this.$('#password').val();

    app.userIsAttemptingLogin = true;
    oh.login(username, password)
      .done(function() {
        // TODO: find a more Backboney way of refreshing the whole page

        if (app.failedLocation) {
          app.router.navigate(app.failedLocation, { replace: true });
        } else {
          app.router.navigate('', { trigger: true, replace: true });
        }
        window.location.reload();
      })
      .error(function(msg, code) {
        // Force new accounts to change their password
        if (code === '0202') {
          var newPassword = window.prompt('You must enter a new password:');
          oh.user.change_password({ user: username, password: password, new_password: newPassword })
            .error(function(msg) {
              alert('Error: ' + msg);
            })
            .done(function() {
              // Assume that if their password change was successful, they can immediately log in
              oh.login(username, newPassword).always(function() {
                if (app.failedLocation) {
                  app.router.navigate(app.failedLocation, { replace: true });
                } else {
                  app.router.navigate('', { trigger: true, replace: true });
                }
                window.location.reload();
              });
            });
        }
        else {
          alert('Error: ' + msg);
        }
      })
      .always(function() {
        app.userIsAttemptingLogin = false;
      });
  },
  enterKey: function(e) {
    // Submit form on enter
    if (e.keyCode === 13) {
      this.login();
    }
  }
});
