var app = require('../app');

module.exports = HeaderView = Backbone.View.extend({
  el: '#header',
  linkTemplate: _.template('<li><a href="<%= url %>"><%= text %></a></li>'),
  dropdownTemplate: _.template('<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><img src="images/user-gold.png"> <%= text %> <span class="caret"></span></a><ul class="dropdown-menu user-menu"></ul></li>'),
  initialize: function() {
  },
  render: function() {
    if (app.user) {
      if (app.user.get('role') === 'evaluator' || app.user.get('role') === 'admin') {
        this.$('#navbar-links').append(this.linkTemplate({ url: '#portfolios', text: 'Review'  }));
        this.$('#navbar-links').append(this.linkTemplate({ url: '#explore',    text: 'Explore' }));
        this.$('#navbar-links').append(this.linkTemplate({ url: '#summary',    text: 'Summary' }));

        if (app.user.get('role') === 'admin') {
          this.$('#navbar-links').append(this.linkTemplate({ url: '#users', text: 'Users' }));
        }
      }

      else {
        this.$('#navbar-links').append(this.linkTemplate({ url: '#explore',      text: 'Explore'      }));
        this.$('#navbar-links').append(this.linkTemplate({ url: '#my-portfolio', text: 'My Portfolio' }));
        this.$('#navbar-links').append(this.linkTemplate({ url: '#collect',      text: 'Collect'      }));
      }

      this.$('#navbar-profile').append(this.linkTemplate({ url: '#', text: 'Help' }));
      this.$('#navbar-profile').append(this.dropdownTemplate({ text: app.user.get('username') }));

      this.$('#navbar-profile .dropdown-menu').append(this.linkTemplate({ url: '#user/' + app.user.get('username'), text: '<span class="hover-border">My Profile</span>' }));
      this.$('#navbar-profile .dropdown-menu').append(this.linkTemplate({ url: '#logout', text: '<span class="hover-border">Logout</span>' }));

      // Confirm before doing the logout action
      this.$('#navbar-profile .dropdown-menu > li:last').click( function(event) {
        window.confirm('Are you sure you want to log out?',function(logout){
          if(logout){
            app.router.navigate('logout', {trigger: true, replace: true});
          }
        });
        return false;
      });
    }

    return this;
  }
});
