var app = require('../app');
var oh = require('../oh');

module.exports = PhotoView = Backbone.View.extend({
  el: 'body',
  template: _.template('<img src="/app/media/read?client=<%= app.config.client %>&id=<%= id %>">'),
  initialize: function(params) {
    this.id       = params.id;
    this.rotation = params.rotation || 0;
  },
  render: function() {
    this.$el.html(this.template({ id: this.id }));

    var self = this;
    this.$('img').on('load', function() {
      // Fix body height so there is enough room to rotate
      var width = $(this).width();
      self.$el.css({
        'padding-top': 0,
        'height':      width + 'px',
        'line-height': width + 'px'
      });

      // Rotate image
      $(this).css({
        'transform':         'rotate(' + self.rotation + 'deg)',
        '-webkit-transform': 'rotate(' + self.rotation + 'deg)',
        '-ms-transform':     'rotate(' + self.rotation + 'deg)'
      });
    });

    return this;
  }
});
