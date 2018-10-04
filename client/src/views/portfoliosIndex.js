var app = require('../app');
var oh = require('../oh');

var LightboxView = require('./lightbox');

app.Artifact = Backbone.Model.extend({
  defaults: {
    title: '',
    type: '',
    description: '',
    day: '',
    folder: '',
    sortId: 0,
    permalink: '',
    files: [],
    responses: []
  },
  isBlacklisted: function(responseName) {
    try {
      var surveyId = this.get('survey_id');
      return _.contains(app.config.responseBlacklist[surveyId], responseName);
    }
    catch (e) {
      return false;
    }
  },
  initialize: function() {
    var files     = [];
    var responses = [];
    var self      = this;

    _.each(this.get('responses'), function(response, responseName) {
      if (_.contains(['NOT_DISPLAYED', 'SKIPPED'], response.prompt_response)) {
        return;
      }
      else if (_.contains(['AssessmentArtifactDayFolder', 'InstructionalArtifactDayFolder'], responseName)) {
        self.set('day', response.prompt_response.toString());
        self.set('folder', 'Day ' + app.zeroPad(response.prompt_response, 2));
        self.set('sortId', response.prompt_response);
      }
      else if (_.contains(['2AssessmentArtifactType', '2InstructionalArtifactType'], responseName)) {
        self.set('description', response.prompt_response);
      }
      else if (_.contains(['document', 'photo', 'video'], response.prompt_type)) {
        if (_.contains(app.config.modificationResponseNames, responseName)) {
          response.modification = true;
        }
        files.push(response);
      }
      else if (!self.isBlacklisted(responseName)) {
        if (response.prompt_type === 'single_choice') {
          // For single choice types, response is an index into the choice glossary
          // So let's extract the real human-readable value
          response.prompt_response = response.prompt_choice_glossary[response.prompt_response].label;
        }
        else if (response.prompt_type === 'multi_choice_custom') {
          // For multi choice custom types, join the reponses together
          response.prompt_response = response.prompt_response.join(', ');
        }
        response.name = responseName;
        responses.push(response);
      }
    });

    switch (this.get('survey_id')) {
      case '1InitialReflection':
        this.set('title', 'Initial Artifact');
        this.set('folder', 'Initial');
        this.set('sortId', 0);
        break;
      case '2AssessmentArtifacts':
        this.set('type', 'Assessment Artifact');
        this.set('title', this.get('description') + ' | Assessment Artifact');
        break;
      case '3InstructionArtifacts':
        this.set('type', 'Instruction Artifact');
        this.set('title', this.get('description') + ' | Instruction Artifact');
        break;
      case '4ConcludingReflection':
        this.set('title', 'Concluding Artifact');
        this.set('folder', 'Concluding');
        this.set('sortId', 9999);
        break;
    }

    this.set('files', files);
    this.set('responses', _.sortBy(responses, function(a) {
      return a.prompt_index;
    }));
  }
});

app.Artifacts = Backbone.Collection.extend({
  model: app.Artifact,
  comparator: function(a, b) {
    // Sort by 'sortId' first (Initial > Day # > Concluding), then by timestamp
    if (a.get('sortId') > b.get('sortId')) {
      return 1;
    }
    else if (a.get('sortId') < b.get('sortId')) {
      return -1;
    }
    else {
      return a.get('time') > b.get('time') ? 1 : -1;
    }
  },
  initialize: function(filters) {
    var self = this;

    if (!filters.teacher || !filters.portfolio) {
      return;
    }

    var params = {
      user_list:    filters.teacher,
      campaign_urn: filters.portfolio
    };

    self.waitTimeout = false;

    // If folder is initial or concluding, we can grab only those surveys
    if (_.contains(['1InitialReflection', '4ConcludingReflection'], filters.folder)) {
      // Artifact type makes no sense here, so bail out
      if (filters.artifactType) {
        return;
      }
      else {
        params.survey_id_list = filters.folder;
      }
    }

    // If artifact type is set, we can also grab specific surveys
    else if (filters.artifactType) {
      params.survey_id_list = filters.artifactType;
    }

    self.waitTimeout = window.setTimeout( function() {
      window.wait('Fetching Portfolio Details...');
    }, 500);

    oh.response.read_custom(params).done(function(surveyData) {
      // close any modals
      $('#modalPermanent').modal('hide');

      if (self.waitTimeout !== false) {
        window.clearTimeout(self.waitTimeout);
        self.waitTimeout = false;
      }


      self.reset(_.map(surveyData, function(survey) {
        var url;
        if (app.user.get('role') === 'teacher') {
          url = '#my-portfolio';
        }
        else {
          url = '#portfolios/' + filters.teacher;
        }
        url += '/' + filters.portfolio + '/' + survey.survey_key;

        return _.extend(survey, { permalink: url });
      }));
    });
  }
});

app.ArtifactSummaryView = Backbone.View.extend({
  tagName: 'a',
  className: 'list-group-item artifact-link',
  attributes: function() {
    return {
      id:   this.model.get('survey_key'),
      href: this.model.get('permalink')
    };
  },
  template: _.template('<span class="folder"><%= folder %></span><%= description %>'),
  render: function() {
    this.$el.html(this.template(this.model.attributes));

    return this;
  }
});

app.ArtifactDetailView = Backbone.View.extend({
  tagName: 'div',
  className: 'panel panel-primary artifact-details',
  artifactTemplate: _.template('<div class="panel-body artifact-details-inner"><h2><%= title %></h2><div class="carousel-container hidden text-center"></div><dl id="responses"></dl></div>'),
  responseTemplate: _.template('<dt><%= question %></dt><dd><%= answer %></dd>'),
  carouselTemplate: _.template('<div class="carousel-content"><img class="carousel-button carousel-left" src="images/left-arrow.png"><img class="carousel-button carousel-ccw" src="images/rotate-ccw.png"><img class="carousel-button carousel-right" src="images/right-arrow.png"><img class="carousel-button carousel-cw" src="images/rotate-cw.png"></div><div class="carousel-status"></div>'),
  carouselTemplateExport: _.template('<div class="carousel-content"></div>'),
  statusTemplate: _.template('<div class="item-status" data-index="<%= index %>"><%= index %> of <%= fileCount %> <%= extra %><br><a href="<%= download %>">Download</a></div>'),
  itemTemplateExport: _.template('<div id="<%= id %>" class="item"><%= item %></div>'),
  fileTemplates: {
    photo: _.template('<div class="rotation-space item" data-index="<%= index %>"><img class="lightbox-link" src="<%= link %>"></div>'),
    document: _.template('<a class="item" data-index="<%= index %>" href="<%= link %>"><img src="images/document.png"></a>'),
    video: _.template('<video class="item" data-index="<%= index %>" controls><source src="<%= link %>" type="video/mp4"></video>')
  },
  fileTemplatesExport: {
    photo: _.template('<div class="photo"><a><img></a></div>'),
    document: _.template('<a><img src="images/document.png"></a>'),
    video: _.template('<video controls><source type="video/mp4"></video>')
  },
  events: {
    'click .carousel-left': 'carouselLeft',
    'click .carousel-right': 'carouselRight',
    'click .carousel-ccw': 'carouselCCW',
    'click .carousel-cw': 'carouselCW',
    'click .lightbox-link': 'openLightbox'
  },
  fileHref: function(id) {
    return '/app/media/read?client=' + app.config.client + '&id=' + id;
  },
  downloadHref: function(file) {
    var href = this.fileHref(file.prompt_response);

    if (file.prompt_type === 'video') {
      href += '&force_filename=' + file.prompt_response + '.mp4';
    }
    else if (file.prompt_type === 'photo') {
      href += '&force_filename=' + file.prompt_response + '.jpg';
    }

    return href;
  },
  render: function(exporting) {
    var self = this;

    this.$el.html(this.artifactTemplate(this.model.attributes));

    var files = this.model.get('files');
    if (files.length > 0) {
      this.$('.carousel-container').html(exporting ? this.carouselTemplateExport() : this.carouselTemplate());

      _.each(files, function(file, i) {
        var itemHtml;

        // If exporting, use separate templates that have less stuff
        if (exporting) {
          itemHtml = self.fileTemplatesExport[file.prompt_type]();
          self.$('.carousel-content').append(self.itemTemplateExport({ id: file.prompt_response, item: itemHtml }));
        }
        else {
          self.$('.carousel-content').append(self.fileTemplates[file.prompt_type]({ link: self.fileHref(file.prompt_response), index: i + 1 }));
          self.$('.carousel-status').append(self.statusTemplate({ index: i + 1, fileCount: files.length, download: self.downloadHref(file), extra: file.modification ? '(modification)' : '' }));
        }
      });

      if (!exporting) {
        this.$('.carousel-content .item:not(:first)').hide();
        this.$('.carousel-status .item-status:not(:first)').hide();
      }
      this.$('.carousel-container').removeClass('hidden');

      // Hide rotation buttons for non-photos
      if (files[0].prompt_type !== 'photo') {
        this.$('.carousel-ccw').hide();
        this.$('.carousel-cw' ).hide();
      }
    }

    _.each(this.model.get('responses'), function(response) {
      self.$('#responses').append(self.responseTemplate({ question: response.prompt_text, answer: response.prompt_response }));
    });

    return this;
  },
  carouselLeft: function() {
    this.carouselShift(-1);
  },
  carouselRight: function() {
    this.carouselShift(1);
  },
  carouselShift: function(offset) {
    var itemCount = this.$('.carousel-content .item').length;
    var current = this.$('.carousel-content .item:visible');
    var currentIndex = current.data('index');

    this.$('[data-index="' + currentIndex + '"]').hide();

    // Adjust current item, wrap around
    currentIndex += offset;
    if (currentIndex < 1) {
      currentIndex = itemCount;
    }
    else if (currentIndex > itemCount) {
      currentIndex = 1;
    }

    this.$('[data-index="' + currentIndex + '"]').show();
  },
  carouselCCW: function() {
    this.carouselRotate(270);
  },
  carouselCW: function() {
    this.carouselRotate(90);
  },
  carouselRotate: function(offset) {
    // Only rotate images
    var img = this.$('.carousel-content .item:visible img').first();

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
      var oldHeight = img.height();
      img.css('width', oldHeight);
      var margin = (oldHeight - img.height()) / 2;
      img.css('margin', margin + 'px 0');
    }
  },
  openLightbox: function() {
    var self = this;
    var photos = _.map(this.model.get('files'), function(file) {
      return {
        url: self.fileHref(file.prompt_response),
        modification: file.modification
      };
    });

    var lightbox = new LightboxView(photos);
    $('#modalContent').html(lightbox.render().el);
    $('#modalPermanent .modal-dialog').addClass('lightbox-modal');

    // Display the current image in the lightbox
    lightbox.carouselShow($('.rotation-space:visible').data('index'));
    $('#modalPermanent').modal('show');

    // Turn on pan/zoom feature, allow mousewheel to zoom too
    $('#modalPermanent .panzoom').panzoom({
      $zoomIn:  $('.lightbox-top .zoom-in' ),
      $zoomOut: $('.lightbox-top .zoom-out')
    }).on('mousewheel DOMMouseScroll', function(e) {
      e.preventDefault();
      var delta = e.delta || e.originalEvent.wheelDelta;
      var focalPoint = e;

      // Fix for Firefox
      if (delta === undefined) {
        delta = -e.originalEvent.detail;
        focalPoint = {
          clientX: e.originalEvent.clientX,
          clientY: e.originalEvent.clientY
        };
      }

      $(this).panzoom('zoom', delta < 0, {
        increment: 0.1,
        animate: false,
        focal: focalPoint
      });
    });

    $('#modalPermanent').on('hidden.bs.modal', function() {
      // Set the size back to normal on close, so alerts aren't affected
      $('#modalPermanent .modal-dialog').removeClass('lightbox-modal');

      // Remove old view so events don't stack if it's re-opened
      lightbox.remove();
    });
  }
});

var portfoliosIndexTemplate = JST['templates/portfoliosIndex.html'];
module.exports = PortfoliosIndexView = Backbone.View.extend({
  el: '#content',
  template: portfoliosIndexTemplate,
  selectTeacherTemplate: _.template('<div class="col-sm-2 form-group"><label for="select-teacher">Teacher:</label><select id="select-teacher" class="form-control"><option value="" disabled selected>Select a teacher</option></select></div>'),
  optionTemplate: _.template('<option value="<%= value %>"><%= text %></option>'),
  exportButtonTemplate: _.template('<div class="text-right"><button id="export-button" class="btn btn-primary"><img src="images/export-icon.png"> Export</button></div>'),
  buttonsTemplate: _.template('<div class="text-right"><%= buttons %></div>'),
  printButtonTemplate: _.template('<button id="print-button" class="btn btn-primary"><img src="images/print.png"> Print</button>'),
  editButtonTemplate: _.template('<a href="#edit/<%= campaignUrn %>/<%= surveyId %>/<%= surveyKey %>" id="edit-button" class="btn btn-primary"><img src="images/edit.png"> Edit</a>'),
  events: {
    'click #apply-filters': 'applyFilters',
    'change #select-portfolio': 'applyFilters',
    'change #select-teacher': 'applyFilters',
    'change #filter-folder': 'applyFilters',
    'change #filter-type': 'applyFilters',
    'click .artifact-link': 'clickArtifact',
    'click #print-button': 'print',
    'click #edit-button': 'edit',
    'click #export-button': 'export'
  },
  keyAction: function (e) {
    if (e.keyCode === 38) {
      $(".list-group-item.artifact-link.active").prev().click();
      return false;
    } else if (e.keyCode === 40) {
      $(".list-group-item.artifact-link.active").next().click();
      return false;
    }
  },
  refreshSizes: function() {
    // Keep artifact details the same height as the screen
    var available = window.innerHeight - $('.artifact-details-container').offset().top - 45;

    // Account for Print button height
    if ($('#print-button').length) {
      available -= 55;
    }

    $('.artifact-list').css('max-height', (available + 20) + 'px');
    $('.artifact-details-inner').css('height', available + 'px');
  },
  scrollActive: function() {
    // Scroll active artifact to the middle of the list
    var itemHeight = $('.artifact-link').first().outerHeight() - 1;
    var baseScroll = $('.artifact-list').height() / 2;
    var index = $('.artifact-link.active').index();
    $('.artifact-list').scrollTop(itemHeight * index - baseScroll);
  },
  initialize: function(params) {
    this.filters = {};

    if (params.filters) {
      this.filters.teacher   = params.filters[0];
      this.filters.portfolio = params.filters[1];

      // If the 3rd parameter is a GUID, it's a permalink to an artifact
      if (app.reGuid.test(params.filters[2])) {
        this.filters.artifactId = params.filters[2];
      }

      // If the 3rd parameter is an artifact type, then there is no folder filter
      else if (_.contains(['2AssessmentArtifacts', '3InstructionArtifacts'], params.filters[2])) {
        this.filters.artifactType = params.filters[2];
      }

      // Otherwise, the 3rd and 4th parameters are folder and artifact type (if they exist)
      else {
        this.filters.folder       = params.filters[2];
        this.filters.artifactType = params.filters[3];
      }
    }
  },
  render: function() {
    var self = this;

    this.$el.html(this.template({
      title: app.user.get('role') === 'teacher' ? 'My Portfolio Details' : 'Review Portfolio Details'
    }));

    // If the user is a teacher, override the filter to only show their own stuff
    if (app.user.get('role') === 'teacher') {
      this.filters.teacher = app.user.get('username');
    }

    else {
      this.$('.filters').prepend(this.selectTeacherTemplate);

      // Generate list of restricted usernames, sorted by username
      var teachers = _.pairs(app.classInfo.users);
      teachers = _.filter(teachers, function(a) { return a[1] === 'restricted'; });
      teachers = _.map(teachers, function(a) { return a[0]; });
      teachers.sort();

      // Add teachers to dropdown
      _.each(teachers, function(username) {
        self.$('#select-teacher').append(self.optionTemplate({ value: username, text: username }));
      });
    }

    // Generate list of whitelisted portfolios, sorted by display name
    var portfolios = _.pairs(app.user.get('campaigns'));
    portfolios = _.filter(portfolios, function(a) { return _.contains(app.config.portfolioWhitelist, a[0]); });
    portfolios = _.sortBy(portfolios, function(a) { return a[1]; });

    // Add portfolios to dropdown
    _.each(portfolios, function(portfolio) {
      self.$('#select-portfolio').append(self.optionTemplate({ value: portfolio[0], text: portfolio[1] }));
    });

    // Add folder filters to dropdown, hardcoded (except for # of days)
    this.$('#filter-folder').append(this.optionTemplate({ value: '1InitialReflection', text: 'Initial' }));
    for (var i = 1; i <= app.config.dayMax; i++) {
      this.$('#filter-folder').append(this.optionTemplate({ value: 'day' + i, text: 'Day ' + app.zeroPad(i, 2) }));
    }
    this.$('#filter-folder').append(this.optionTemplate({ value: '4ConcludingReflection', text: 'Concluding' }));

    // Add export button for teachers and admins
    if (app.user.get('role') === 'teacher' || app.user.get('role') === 'admin') {
      this.$('.filters').append(this.exportButtonTemplate);
    }

    // Set dropdowns based on the current filters, then run them
    this.$('#select-teacher'  ).val(this.filters.teacher     );
    this.$('#select-portfolio').val(this.filters.portfolio   );
    this.$('#filter-folder'   ).val(this.filters.folder      );
    this.$('#filter-type'     ).val(this.filters.artifactType);
    this.runFilters();

    return this;
  },
  applyFilters: function() {
    var teacher   = app.user.get('role') === 'teacher' ? app.user.get('username') : this.$('#select-teacher').val();
    var portfolio = this.$('#select-portfolio').val();
    var folder    = this.$('#filter-folder'   ).val();
    var type      = this.$('#filter-type'     ).val();

    if (!teacher || !portfolio) {
      return;
    }

    var url;
    if (app.user.get('role') === 'teacher') {
      url = 'my-portfolio';
    }
    else {
      url = 'portfolios/' + teacher;
    }
    url += '/' + portfolio;
    if (folder) {
      url += '/' + folder;
    }
    if (type) {
      url += '/' + type;
    }

    app.router.navigate(url, { trigger: true });
  },
  runFilters: function() {
    if (!this.filters.teacher || !this.filters.portfolio) {
      return;
    }

    app.artifacts = new app.Artifacts(this.filters);
    this.listenTo(app.artifacts, 'reset', this.addAll);
  },
  addOne: function(artifact) {
    var view = new app.ArtifactSummaryView({ model: artifact });
    var item = view.render().$el;
    this.$('.artifact-list').append(item);
  },
  addAll: function() {
    var artifacts, count;

    // If a day filter was given, filter the list
    if (this.filters.folder && this.filters.folder.substr(0, 3) === 'day') {
      var day = this.filters.folder.substr(3);
      artifacts = app.artifacts.where({ day: day });
      count = artifacts.length;

      // Needed because 'where' returns a plain array and we need a collection
      artifacts = _(artifacts);
    }

    // Otherwise use the whole collection
    else {
      artifacts = app.artifacts;
      count = artifacts.length;
    }

    artifacts.each(this.addOne, this);

    // If an artifact permalink was given, show it now
    if (this.filters.artifactId) {
      this.showArtifact(this.filters.artifactId);
    }

    // Update stats
    this.$('.stats #artifact-count').text(count);
    this.refreshSizes();
    $(window).on('resize.review', _.bind(this.refreshSizes, this));
    $(document).on('keydown.navigation', _.bind(this.keyAction, this));
  },
  clickArtifact: function(e) {
    // Because the data is already loaded, don't allow backbone to navigate away
    e.preventDefault();

    var link = $(e.target).closest('.artifact-link');
    this.showArtifact(link.attr('id'));
    this.scrollActive();

    // Finally, update the browser's URL to the permalink but don't do router logic
    app.router.navigate(link.attr('href'));
  },
  showArtifact: function(id) {
    var artifact = app.artifacts.findWhere({ survey_key: id });
    var view = new app.ArtifactDetailView({ model: artifact });
    this.$('.artifact-details-container').html(view.render().el);

    // Highlight only the active artifact
    this.$('.artifact-list .list-group-item').removeClass('active');
    this.$('.artifact-list #' + id).addClass('active');

    // Add print/edit buttons for teachers and admins
    if (app.user.get('role') === 'teacher' || app.user.get('role') === 'admin') {
      var buttons = this.printButtonTemplate();
      if (app.user.get('role') === 'teacher') {
        buttons += this.editButtonTemplate({ campaignUrn: this.filters.portfolio, surveyId: artifact.get('survey_id'), surveyKey: id });
      }
      this.$('.artifact-details-container').append(this.buttonsTemplate({ buttons: buttons }));
    }

    this.refreshSizes();
  },
  print: function() {
    window.print();
  },
  export: function() {
    var teacherName = this.filters.teacher;
    var campaignName = app.user.get('campaigns')[this.filters.portfolio];
    var zip = new JSZip();

    // Use the page's HTML as a skeleton (minus headers and other stuff)
    var skeleton = $('html').clone();
    skeleton.find('script').remove();
    skeleton.find('header').remove();
    skeleton.find('.stats').remove();
    skeleton.find('.filters').remove();
    skeleton.find('.artifact-details-container').empty();

    // Generate human-readable artifact names
    var artifactNames = {};
    var digits = (app.artifacts.length + 1).toString().length;
    app.artifacts.each(function(artifact, i) {
      var artifactName = app.zeroPad(i + 1, digits);
      artifactName += ' - ' + artifact.get('folder');
      if (artifact.get('description')) {
        artifactName += ' - ' + artifact.get('description').replace(/\//, ' ');
      }
      artifactNames[artifact.get('survey_key')] = artifactName;
    });

    // Turn each link in the left hand navigation into a local link
    skeleton.find('.artifact-link').each(function() {
      $(this).removeClass('active');
      $(this).attr('href', artifactNames[$(this).attr('id')] + '.html');
    });
    zip.file('index.html', skeleton.get(0).outerHTML);

    // Begin AJAX queue with files that are always needed
    var queue = [];
    queue.push(app.ajaxWithMetadata('e-qis-web.css', {}, { path: '', filename: 'e-qis-web.css' }));
    queue.push(app.ajaxWithMetadata('images/document.png', { dataType: 'binary', processData: false }, { path: 'images/', filename: 'document.png' }));

    // Add an HTML file for each artifact, as it would have been rendered on the page
    var pages = {};
    app.artifacts.each(function(artifact) {
      var view = new app.ArtifactDetailView({ model: artifact });
      var htmlCopy = skeleton.clone();
      var surveyKey = artifact.get('survey_key');
      var artifactName = artifactNames[surveyKey];

      // Add rendered artifact into skeleton HTML, save for later
      htmlCopy.find('.artifact-details-container').html(view.render(true).el);
      htmlCopy.find('#' + surveyKey).addClass('active');
      pages[artifactName + '.html'] = htmlCopy;

      // Add files to AJAX queue
      _.each(artifact.get('files'), function(file, i) {
        var filename = file.prompt_type + ' ' + (i + 1);
        queue.push(app.ajaxWithMetadata(view.fileHref(file.prompt_response), { dataType: 'binary', processData: false }, { path: artifactName + '/', filename: file.prompt_response, baseFilename: filename }));
      });
    });

    // When the AJAX queue is finished, add the files to the zip
    var usedFilenames = {};
    var filenameMap   = {};
    $.when.apply($, queue).done(function() {
      _.each(arguments, function(file, i) {
        var content = file[0];
        var xhr = file[2];
        usedFilenames[xhr.path] = usedFilenames[xhr.path] || [];

        // Get filename from HTTP headers if possible
        var filename = app.filenameFromAjax(xhr);
        if (filename) {
          filename = app.filenameCollision(filename, usedFilenames[xhr.path]);
        }

        // If the requested filename has an extension, use it as-is
        else if (xhr.filename.match(/\./)) {
          filename = xhr.filename;
        }

        // Otherwise, use the base filename plus an extension from the MIME type
        else {
          filename = xhr.baseFilename + app.extensionFromAjax(xhr);
        }

        filenameMap[xhr.filename] = xhr.path + filename;
        usedFilenames[xhr.path].push(filename);
        zip.file(xhr.path + filename, content);
      });

      // Fix each artifacts's file URLs so they point to the local ones
      _.each(pages, function(page, filename) {
        page.find('.item').each(function() {
          var id = $(this).attr('id');
          var url = filenameMap[id];

          $(this).find('a').attr('href', url);
          $(this).find('.photo img').attr('dummy-src', url);
          $(this).find('source').attr('src', url);
        });

        // Replace dummy-src attributes with real src ones now
        // (setting src in jQuery above would have downloaded the images)
        var html = page.get(0).outerHTML;
        zip.file(filename, html.replace(/dummy-src=/g, 'src='));
      });

      // Serve the finished zip file to the client
      zip.generateAsync({ type: 'blob' }).then(function(blob) {
        saveAs(blob, teacherName + ' - ' + campaignName + '.zip');
      });
    }).fail(function() {
      console.log('fail!', arguments);
    });
  },
  remove: function() {
    // Clean up event handlers
    $(document).off('keydown.navigation');
    $(window).off('resize.review');

    // Call parent removal code
    Backbone.View.prototype.remove.apply(this);
  }
});
