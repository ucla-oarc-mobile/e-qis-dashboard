var app = require('../app');
var oh = require('../oh');
var Users = require('../entities/users');

var newUserTemplate = JST['templates/newUser.html'];

module.exports = NewUserView = Backbone.View.extend({
  el: '#content',
  template: newUserTemplate,
  events: {
    'click #saveUser': 'createUser',
  },
  render: function () {
    this.$el.html(this.template());
    return this;
  },
  createUser: function () {
    var username = $("#usernameBox").val();
    var password = $("#passwordBox").val();
    var firstName = $("#firstNameBox").val();
    var lastName = $("#lastNameBox").val();
    var email = $("#emailBox").val();
    var role = $("input[name='role']:checked").val();
    var admin = false;

    // this is to determin if the person is an admin or evaluator
    var privileged = "restricted";
    if (role === "admin") {
      admin = true;
      privileged = "privileged";
    } else if (role === "evaluator") {
      privileged = "privileged";
    }

    //first create the user with his BASIC info
    oh.user.create({
      username: username,
      admin: admin,
      enabled: true,
      password: password,
      email_address: email,
      new_account: false,
    }).done(function () {

      //this is to add the person to the class and make him a teacher or evaluator this must be done first i am not really sure why
      oh.class.update({
        user_role_list_add: username + ";" + privileged,
        class_urn: app.classInfo.urn
      }).error(function (data) {
        alert("user created, but not added to the class error code:" + data);
      }).done(function () {
        app.classInfo.users[username] = privileged;

        //You need to wait for the previous call to finish.after you create the user then you need to give him admin rights, and give him a name and email
        oh.user.update({
          username: username,
          new_account: false,
          first_name: firstName,
          user_setup_privilege: admin,
          last_name: lastName,
          organization: "equis",
          personal_id: Math.random().toString(36).slice(2),
          email_address: email,
        }).error(function(){
          alert("problem saving name, email, and admin Rights");
        }).done(function () {
          alert("user created");
        });
      });
    });
  },
});
