var lightboxTemplate = JST['templates/lightbox.html'];

module.exports = lightboxView = Backbone.View.extend({
  tagName: 'div',
  template: lightboxTemplate,
  imgTemplate: _.template('<div class="panzoom"><img class="photo" data-index="<%= index %>" data-modification="<%= modification %>" src="<%= src %>"></div>'),
  thumbnailTemplate: _.template('<img class="photo" data-index="<%= index %>" src="<%= src %>">'),
  events: {
    'click .carousel-left': 'carouselLeft',
    'click .carousel-right': 'carouselRight',
    'click .carousel-ccw': 'carouselCCW',
    'click .carousel-cw': 'carouselCW',
    'click .lightbox-bottom .photo': 'photoClick'
  },
  initialize: function(photos) {
    this.photos = photos;
  },
  render: function() {
    this.$el.html(this.template());
    var self = this;

    _.each(this.photos, function(photo, i) {
      self.$('.pan-space      ').append(self.imgTemplate      ({ index: i + 1, src: photo.url, modification: photo.modification }));
      self.$('.lightbox-bottom').append(self.thumbnailTemplate({ index: i + 1, src: photo.url                                   }));
    });

    this.$('.lightbox-top .photo:not(:first)').hide();
    this.$('.lightbox-bottom .photo:first').addClass('active');

    return this;
  },
  carouselLeft: function() {
    this.carouselShift(-1);
  },
  carouselRight: function() {
    this.carouselShift(1);
  },
  carouselShift: function(offset) {
    var itemCount = this.$('.lightbox-top .photo').length;
    var currentIndex = this.$('.lightbox-top .photo:visible').data('index');

    // Adjust current item, wrap around
    currentIndex += offset;
    if (currentIndex < 1) {
      currentIndex = itemCount;
    }
    else if (currentIndex > itemCount) {
      currentIndex = 1;
    }

    this.carouselShow(currentIndex);
  },
  carouselShow: function(index) {
    var topPhotos = this.$('.lightbox-top .photo');
    var bottomPhotos = this.$('.lightbox-bottom .photo');
    var topActive = topPhotos.filter('[data-index="' + index + '"]');
    var bottomActive = bottomPhotos.filter('[data-index="' + index + '"]');

    topPhotos.hide();
    bottomPhotos.removeClass('active');

    topActive.show();
    bottomActive.addClass('active');

    // Update title to show if image is a modification or not
    this.$('.lightbox-title').text(topActive.data('modification') ? '(modification)' : '');
  },
  carouselCCW: function() {
    this.carouselRotate(270);
  },
  carouselCW: function() {
    this.carouselRotate(90);
  },
  carouselRotate: function(offset) {
    // Only rotate images
    var img = this.$('.lightbox-top .photo:visible, .lightbox-bottom .active');

    // See how many degrees it's been rotated already
    var rotation = img.data('rotation') || 0;

    // Add degrees, normalize so 0 <= rotation < 360
    rotation += offset;
    rotation %= 360;
    img.data('rotation', rotation);

    // Cross-browser rotation transform
    img.css({
      'transform':         'rotate(' + rotation + 'deg)',
      '-webkit-transform': 'rotate(' + rotation + 'deg)',
      '-ms-transform':     'rotate(' + rotation + 'deg)'
    });

    // Allow extra space for portrait orientation
    if (rotation === 0 || rotation === 180) {
      img.css({ width: '', margin: '' });
    }
    else {
      img.each(function() {
        var oldHeight = $(this).height();
        $(this).css('width', oldHeight);
        var margin = (oldHeight - $(this).height()) / 2;
        $(this).css('margin', margin + 'px 0');
      });
    }
  },
  photoClick: function(e) {
    this.carouselShow($(e.target).data('index'));
  }
});
