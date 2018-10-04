var app = {};

app.config = require('./config');

app.reGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

app.guid = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0;
    var v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

app.zeroPad = function(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
};

app.isAdmin = function(user){
  if(user){
    return user.get('role') === 'admin';
  }
  console.error("The arguemnt User is undefined");
  return false;
};

app.isSelf = function(user,username){
  if(user){
    return user.get('username') === username;
  }
  console.error("The arguemnt user is undefined");
  return false;
};

app.sendToLogin = function(){
  if(Backbone.history.fragment !== "login"){
    this.failedLocation = Backbone.history.fragment;
  }

  app.router.navigate('login', {trigger: true, replace: true});
};

// Extracts the filename from HTTP headers in AJAX call
app.filenameFromAjax = function(xhr) {
  var contentDisposition = xhr.getResponseHeader('Content-Disposition');
  if (!contentDisposition) {
    return '';
  }
  if (contentDisposition.match(/attachment; filename=/)) {
    return contentDisposition.replace(/attachment; filename=/, '');
  }
  else {
    return '';
  }
};

// Determines file extension from MIME type in HTTP headers
app.extensionFromAjax = function(xhr) {
  var types = {
    'image/jpeg': '.jpg',
    'image/png' : '.png',
    'image/gif' : '.gif',
    'application/pdf': '.pdf',
    'video/3gpp':      '.3gp',
    'video/mp4':       '.mp4',
    'video/quicktime': '.mov'
  };

  var contentType = xhr.getResponseHeader('Content-Type');
  return types[contentType] || '';
};

// Returns a suitable filename that won't collide with a list of existing ones
app.filenameCollision = function(desired, used) {
  // If filename isn't in use, just return it
  if (!_.contains(used, desired)) {
    return desired;
  }

  // If the filename has an extension, separate it from the initial part
  var extension = '';
  if (desired.indexOf('.') > -1) {
    var components = desired.split('.');
    extension = '.' + components.pop();
    desired = components.join('.');
  }

  // If "filename.jpg" is in use, try "filename (1).jpg", "filename (2).jpg", etc.
  var i = 1;
  var attempt;
  do {
    attempt = desired + ' (' + i++ + ')' + extension;
  } while (_.contains(used, attempt));

  return attempt;
};

// Makes an AJAX request and adds artibrary metadata to xhr object
app.ajaxWithMetadata = function(url, ajaxOptions, metadata) {
  ajaxOptions.beforeSend = function(jqxhr, settings) {
    _.each(metadata, function(value, key) {
      jqxhr[key] = value;
    });
  };

  return $.ajax(url, ajaxOptions);
};

module.exports = app;
