var GenericFilterView = require('./genericFilter');

var ExploreFiltersTemplate = JST['templates/explore/filters.html'];


module.exports = ExploreFiltersLayout = Marionette.LayoutView.extend({
  className: "filters row",
  initialize: function() {
    this.model = new Backbone.Model({
      'teacher': '',
      'portfolio': '',
      'portfolioName': '',
      'artifact': '',
      'question': '',
      'mediatype': ''
    });

  },
  template: ExploreFiltersTemplate,
  regions: {
    teachers: "#teachers-filter",
    portfolios: "#portfolios-filter",
    artifacts: "#artifacts-filter",
    questions: "#questions-filter",
    mediatypes: "#mediatypes-filter",
  },
  getQuestionsFilterView: function(params) {

    // questions view is a special case.
    // it filters its contents when an Artifact
    // is selected, so a new initializer
    // must be defined with these filter operations.

    QuestionsView = GenericFilterView.extend({
      initialize: function(options) {
        this.listenTo(this, "filter:bysurvey", function(surveyId) {
          if (surveyId !== '' ) {
            // just show matching surveyIds
            this.filter = function(child, index, collection) {
              return child.get('surveyId') === '' || child.get('surveyId') === surveyId;
            };

          } else {
            // reset the filter
            this.filter = null;
          }

          this.render();
        });
      },
      onRender: function() {
        // pass the current number of items in the CollectionView
        // to the collection itself, so other views can listen for it
        this.collection.trigger('filter:length', this.$el.find('option').length);
      }
    });

    questionsView = new QuestionsView(params);

    // the parent layout triggers methods on the child questionsView.
    // this cascades the event downwards and ensures encapsulation.

    this.listenTo(this, 'filter:questions', function(surveyId) {
      questionsView.triggerMethod('filter:bysurvey', surveyId);
    });

    return questionsView;
  },
  onBeforeShow: function() {
    this.showChildView('teachers', new GenericFilterView({
      collection: this.getOption("teachersList"),
      attributeName: 'teachers-select',
      defaultLabel: 'Select a Teacher',
      customEvent: 'select:teacher'
    }));

    this.showChildView('portfolios', new GenericFilterView({
      collection: this.getOption("portfoliosList"),
      attributeName: 'portfolios-select',
      defaultLabel: 'Select a Portfolio',
      customEvent: 'select:portfolio'
    }));

    this.showChildView('artifacts', new GenericFilterView({
      collection: this.getOption("artifactsList"),
      attributeName: 'artifacts-select',
      defaultLabel: 'All Artifacts',
      customEvent: 'select:artifact'
    }));

    this.showChildView('questions', this.getQuestionsFilterView({
      collection: this.getOption("questionsList"),
      attributeName: 'questions-select',
      defaultLabel: 'All Questions',
      customEvent: 'select:question'
    }));

    this.showChildView('mediatypes', new GenericFilterView({
      collection: this.getOption("mediatypesList"),
      attributeName: 'mediatypes-select',
      defaultLabel: 'All Media Types',
      customEvent: 'select:mediatype'
    }));

    // Auto-select the current user if they are a teacher
    if (app.user.get('role') === 'teacher') {
      var teacherName = app.user.get('username');
      this.$('[name="teachers-select"]').val(teacherName);
      this.model.set('teacher', teacherName);
      this.triggerMethod('submit:filters', this, { model: this.model });
    }
  },
  childEvents: {
    "select:teacher": "onTeacherSelect",
    "select:portfolio": "onPortfolioSelect",
    "select:artifact": "onArtifactSelect",
    "select:question": "onQuestionSelect",
    "select:mediatype": "onMediatypeSelect",
  },
  onTeacherSelect: function(childView, args) {
    var teacherName = args.view.$el.val();
    this.model.set('teacher', teacherName);
    this.triggerMethod('submit:filters', this, { model: this.model });
  },
  onPortfolioSelect: function(childView, args) {
    var portfolioId = args.view.$el.val();
    this.model.set('portfolio', portfolioId);
    this.triggerMethod('submit:filters', this, { model: this.model });

  },
  onArtifactSelect: function(childView, args) {
    var surveyId = args.view.$el.val();

    // filter the questions list
    this.triggerMethod('filter:questions', surveyId);
    // reset the selected question to the default
    this.model.set('question', '');

    this.model.set('artifact', surveyId);
    this.triggerMethod('submit:filters', this, {model: this.model});
  },
  onQuestionSelect: function(childView, args) {
    var promptId = args.view.$el.val();
    this.model.set('question', promptId);
    this.triggerMethod('submit:filters', this, { model: this.model });

  },
  onMediatypeSelect: function(childView, args) {
    var mediatype = args.view.$el.val();
    this.model.set('mediatype', mediatype);
    this.triggerMethod('submit:filters', this, { model: this.model });

  },

});
