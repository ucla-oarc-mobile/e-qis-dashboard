var app = require('../app');
var oh = require('../oh');
var Users = require('../entities/users');

var userDetailsTemplate = JST['templates/userDetails.html'];

module.exports = UserDetailsView = Backbone.View.extend({
  el: '#content',
  initialize: function (params) {
    this.username = params.username;
    if (this.username === app.user.get('username')) {
      this.isSelf = true;
    }
  },
  template: userDetailsTemplate,
  events: {
    'click #saveUser': 'saveUser',
    'click #changePassword': 'changePassword',
  },
  render: function () {
    app.users = new Users();
    this.listenTo(app.users, 'reset', function () {
      this.user = this.getUser(this.username);
      if (this.user) {
        this.$el.html(this.template(this.user.attributes));
        $("#" + this.user.attributes.role).click();

        //hide the roles so people dont try giving themselves admin
        if (this.isSelf) {
          $("#roles").hide();
        }

        // Make inputs read-only unless the user is admin
        if (app.user.get('role') !== 'admin') {
          $('#firstNameBox, #lastNameBox, #emailBox').prop('readonly', true);
          $('#saveUser').hide();
          $('.cannot-update-user').removeClass('hidden');
        }
      }

    }.bind(this));

    return this;
  },
  getUser: function (username) {
    return app.users.where({username: username})[0];
  },
  saveUser: function () {
    var username = $("#usernameBox").val();
    var firstName = $("#firstNameBox").val();
    var lastName = $("#lastNameBox").val();
    var email = $("#emailBox").val();
    var role = $("input[name='role']:checked").val();
    var admin = false;
    var personal_id = this.user.personal_id;
    var isSelf = this.isSelf;
    if (!personal_id) {
      personal_id = Math.random().toString(36).slice(2);
    }

    // this is to determin if the person is an admin or evaluator
    var privileged = "restricted";
    if (role === "admin") {
      admin = true;
      privileged = "privileged";
    } else if (role === "evaluator") {
      privileged = "privileged";
    }

    oh.user.update({
      username: username,
      new_account: false,
      first_name: firstName,
      user_setup_privilege: admin,
      last_name: lastName,
      organization: "equis",
      personal_id: personal_id,
      email_address: email,
    }).done(function () {
      //dont let the user change his own privileges
      if (!isSelf) {
        oh.class.update({
          user_role_list_add: username + ";" + privileged,
          class_urn: app.classInfo.urn
        }).error(function (data) {
          alert("user updated, but role not modified error code:" + data);
        }).done(function () {
          alert("user updated");
          app.classInfo.users[username] = privileged;
        });
      }
    });
  },
  changePassword: function () {
    password = prompt("Please enter your current password");

    //there is different required variables for changing your
    //password than changing someone else's password
    var sendData;
    if (this.isSelf) {
      sendData = {
        user: app.user.attributes.username,
        password: password,
        new_password: $('#passwordBox').val()
      };
    } else {
      sendData = {
        user: app.user.attributes.username,
        password: password,
        username: $('#usernameBox').val(),
        new_password: $('#passwordBox').val()
      };
    }
    oh.user.change_password(sendData).error(function (data) {
      alert(data);
    }).done(function () {
      alert("user updated");
    });
  },
});
