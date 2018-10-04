var app = require('./app');
var oh = require('./oh');
var User = require('./entities/user');
var Router = require('./router');

var HeaderView = require('./views/header');
var ModalView = require('./views/modal');
var ModalAlertView = require('./views/modalAlert');
var ModalConfirmView = require('./views/modalConfirm');
var ModalWaitView = require('./views/modalWait');

oh.callback('error', function (msg, code) {
  // For non-authentication errors, display the error
  if (code !== '0200' && code !== '0202') {
    alert('Error: ' + msg);
  }

  // Logic unless the user is attempting a login (those pages do their own thing)
  else if (!app.userIsAttemptingLogin) {
    // If the user was logged in before, they timed out, so make them log in again
    if (app.user) {
      alert('Your session has expired and you must log in again.', function() {
        app.user = undefined;
        $('#navbar-links, #navbar-profile').empty();
        app.sendToLogin();
      });
    }

    // Otherwise let the app route them to login at the appropriate time
    else {
      app.routeToLogin = true;
    }
  }
});

$(document).ready(function () {
  // Since we don't know the user's status on page load, wait for ohmage call to come back
  app.userStatusUnknown = true;

  app.header = new HeaderView();
  app.modal = new ModalView();
  app.router = new Router();

  var loadPage = function () {
    Backbone.history.start();
    if (app.routeToLogin) {
      app.sendToLogin();
    }
    app.routeToLogin = false;
    app.header.render();
    app.modal.render();
    app.content.render();
  };

  oh.user.info().done(function (userData) {
    var username = _.keys(userData)[0];
    app.user = new User(_.extend(userData[username], {username: username}));

    oh.class.read().done(function (classData) {
      var urn;
      var urns = _.keys(classData);
      if (urns.length > 1) {
        urn = "urn:class:lausd:eqissurveys";
      } else {
        urn = urns[0];
      }
      app.classInfo = classData[urn];
      app.classInfo.urn = urn;

      // Keep user logged in while tab is open
      oh.keepalive();
    }).always(loadPage);
  }).fail(loadPage).always(function () {
    app.userStatusUnknown = false;
  });

  window.app = app;

  //override the alert function
  window.alert = function (msg, callback) {
    var alert = new ModalAlertView(msg);
    alert.render();
    $("#modalPermanent").modal("show").off('hidden.bs.modal');
    if (typeof callback === 'function') {
      $("#modalPermanent").on('hidden.bs.modal', callback);
    }
  };

  //override the confirm function
  window.confirm = function (msg, callback) {
    // Unbind all stale events from past confirmation dialogs
    $('#modalContent').off();

    var confirm = new ModalConfirmView(msg, callback);
    confirm.render();
    $("#modalPermanent").modal("show");
  };

  window.wait = function(msg) {
    var wait = new ModalWaitView(msg);
    wait.render();
    $('#modalPermanent').modal('show');
  };
});
