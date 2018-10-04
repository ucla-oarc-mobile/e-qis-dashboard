var app = require('./app');
var oh = require('./oh');

var ForgotPasswordView = require('./views/forgotPassword');
var UserIndexView = require('./views/userIndex');
var IndexView = require('./views/index');
var LoginView = require('./views/login');
var PortfoliosIndexView = require('./views/portfoliosIndex');
var SummaryLayoutView = require('./views/summaryLayout');
var ExploreLayoutView = require('./views/exploreLayout');
var PhotoView = require('./views/photo');
var UserDetailsView = require('./views/userDetails');
var Users = require('./entities/users');
var CollectDashboardView = require('./views/collect/dashboard');
var CollectEditView = require('./views/collect/edit');

var Router = Backbone.Router.extend({
  routes: {
    '':                        'index',
    'login':                   'login',
    'logout':                  'logout',
    'forgot':                  'forgotPassword',
    'users':                   'userIndex',
    'user/new':                'newUser',
    'user/:username':          'userDetails',
    'portfolios(/*filters)':   'portfolios',
    'my-portfolio(/*filters)': 'myPortfolio',
    'summary(/*filters)':      'summary',
    'explore':                 'explore',
    'photo/:id(/:rotation)':   'photo',
    'collect(/:portfolio)':    'collect',
    'edit/:portfolio/:folder/:artifact': 'edit'
  },
  loadContent: function(ViewClass, params) {
    // Render content if the user is logged in, or page is visible to guests
    if (app.user || ViewClass.prototype.visibleToGuests) {
      if (app.content) {
        app.content.remove();
        $('body').append('<section class="container-fluid" id="content"></section>');
      }
      app.content = new ViewClass(params);
      app.content.render();
      app.loadCount=0;
    }

    // Otherwise, ask guest to log in
    else if (app.userStatusUnknown) {
      app.sendToLogin();
      app.loadCount = 0;
    }

    // if we are still waiting on the user info, wait some more but dont wait longer than 2 seconds.
    else {
      if (app.loadCount < 8) {
        setTimeout(function () {
          this.loadContent(ViewClass, params);
        }.bind(this), 250);
        app.loadCount++;
      } else {
        app.sendToLogin();
        app.loadCount = 0;
      }
    }
  },
  initialize: function(){
    app.loadCount=0;
  },
  index: function() {
    console.log('index route');
    this.loadContent(IndexView);
  },
  login: function() {
    // if the person is already logged in then send the person to the index page dont let them see the login page
    if(app.user){
      this.navigate('', { replace: true });
    } else {
      this.loadContent(LoginView);
    }
  },
  logout: function() {
    oh.user.logout().done(function() {
      // TODO: find a more Backboney way of refreshing the whole page
      this.navigate('login', { replace: true });
      window.location.reload();
    }.bind(this));
  },
  forgotPassword: function() {
    this.loadContent(ForgotPasswordView);
  },
  userIndex: function() {
    // Only let admins in
    if (app.isAdmin(app.user)) {
      var users = new Users();
      this.loadContent(UserIndexView,{collection : users});
    }
    else {
      app.sendToLogin();
    }
  },
  userDetails: function(username) {
    // Only allow admins or users viewing their own profile
    if (app.isAdmin(app.user) || app.isSelf(app.user,username)) {
      this.loadContent(UserDetailsView,{username:username});
    }
    else {
      app.sendToLogin();
    }
  },
  newUser: function() {
    this.loadContent(NewUserView);
  },
  portfolios: function(filters) {
    filters = filters || '';
    this.loadContent(PortfoliosIndexView, { filters: filters.split('/') });
  },
  myPortfolio: function(filters) {
    filters = filters || '';

    // Hack needed because the filters are passed in before we know who the user is
    // TODO: make this less hacky
    var split = [null].concat(filters.split('/'));
    this.loadContent(PortfoliosIndexView, { filters: split });
  },
  summary: function(filters) {
    filters = filters || '';
    this.loadContent(SummaryLayoutView, { filters: filters.split('/') });
  },
  explore: function() {
    this.loadContent(ExploreLayoutView);
  },
  photo: function(id, rotation) {
    this.loadContent(PhotoView, { id: id, rotation: rotation });
  },
  collect: function(portfolio) {
    this.loadContent(CollectDashboardView, portfolio);
  },
  edit: function(portfolio, folder, artifact) {
    this.loadContent(CollectEditView, {
      portfolio: portfolio,
      folder:    folder,
      artifact:  artifact
    });
  }
});

module.exports = Router;
