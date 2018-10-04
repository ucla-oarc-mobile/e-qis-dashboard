var app = require('../app');

// dropdown and filtering entities


var SummaryPortfolios = require('../entities/summary/filterPortfolios');
var SummaryTeachers = require('../entities/summary/filterTeachers');

var SummaryDropdown = require('../entities/summary/filterDropdown');

var ExploreTemp = Backbone.Collection.extend({
  model: SummaryDropdown
});

var ExploreQuestions = require('../entities/explore/filterQuestions');


// results entities

var ExploreTable = require('../entities/explore/table');

var ExploreResults = require('../entities/explore/results');


// Main Layout Region Views

var ExploreFiltersLayout = require('./explore/filtersLayout');

var ExploreResultsView = require('./explore/results');

module.exports = SummaryLayoutView = Marionette.LayoutView.extend({
  el: '#content',
  template: _.template('<div class="clearfix"><div id="box-region"></div> <h3 class=text-primary>Portfolio Exploration</h3></div><div id="filters-region"></div> <div id="results-region"></div>'),
  regions: {
    box: "#box-region",
    filters: "#filters-region",
    results: "#results-region"
  },
  childEvents: {
    "submit:filters": "onFilterSubmit",
  },
  onRender: function() {
    // parent layout view. A mini "controller" of sorts. All data is loaded into
    // the child views of this layout here.



    var summaryTable = new SummaryTable(false, { results: this.collection });


    var teachersList = new SummaryTeachers(app.classInfo.users, {parse: true});
    var portfoliosList = new SummaryPortfolios(app.user.get('campaigns'), {parse: true});

    var artifactsList = new ExploreTemp([
      ['1InitialReflection', "Initial"],
      ['2AssessmentArtifacts', 'Assessment'],
      ['3InstructionArtifacts', 'Instruction'],
      ['4ConcludingReflection', 'Concluding']
    ], {parse: true});

    // ExploreQuestions collection fetches
    // its contents from the ohmage campaign dynamically
    // when the page is loaded, so leave this blank.
    var questionsList = new ExploreQuestions();

    var mediatypesList = new ExploreTemp([
      'text', 'photo','document', 'video'
    ], {parse: true});

    this.collection = new ExploreResults();

    var exploreTable = new ExploreTable(false, { results: this.collection });

    this.showChildView('filters', new ExploreFiltersLayout({
      teachersList: teachersList,
      portfoliosList: portfoliosList,
      artifactsList: artifactsList,
      questionsList: questionsList,
      mediatypesList: mediatypesList
    }));

    this.showChildView('results', new ExploreResultsView({
      collection: exploreTable
    }));

  },
  onFilterSubmit: function(childView, args) {
    if (args.model.get('portfolio') === ''|| args.model.get('teacher') === '') {
      // we require a portfolio to be selected.
      // just do nothing if that's the case.
      return false;
    } else {
      console.log('onFilterSubmit model', args.model.toJSON());
      // fetch the desired filter results from the collection
      this.collection.fetchFiltered(args.model);
    }
  }
});
