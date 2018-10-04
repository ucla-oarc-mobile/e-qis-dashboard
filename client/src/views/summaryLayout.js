var app = require('../app');

// dropdown and filtering entities

var SummaryPortfolios = require('../entities/summary/filterPortfolios');
var SummaryTeachers = require('../entities/summary/filterTeachers');

// results entities

var SummaryCount = require('../entities/summary/count');
var SummaryTable = require('../entities/summary/table');
var SummaryResults = require('../entities/summary/results');

// Main Layout Region Views

var SummaryBox = require('./summary/box');
var SummaryFiltersLayout = require('./summary/filters');
var SummaryResultsView = require('./summary/results');

// **** Main Summary Layout

module.exports = SummaryLayoutView = Marionette.LayoutView.extend({
  el: '#content',
  template: _.template('<div id="box-region"></div> <h3 class=text-primary>Summary of Portfolios to Review</h3> <div id="filters-region"></div> <h4 class="summary-title col-sm-5 pull-right">ARTIFACTS</h4> <div id="results-region"></div>'),
  regions: {
    box: "#box-region",
    filters: "#filters-region",
    results: "#results-region"
  },
  initialize: function(params) {
    this.filters = {};

    if (params.filters) {
      if (params.filters[0] && params.filters[0] !== 'all') {
        this.filters.teacher = params.filters[0];
      }
      if (params.filters[1] && params.filters[1] !== 'all') {
        this.filters.portfolio = params.filters[1];
      }
    }
  },
  onRender: function() {
    // parent layout view. A mini "controller" of sorts. All data is loaded into
    // the child views of this layout here.

    var teachersList = new SummaryTeachers(app.classInfo.users, {parse: true});
    var portfoliosList = new SummaryPortfolios(app.user.get('campaigns'), {parse: true});

    this.collection = new SummaryResults();

    var summaryCount = new SummaryCount({
      teachersCount: teachersList.length,
      portfoliosCount: portfoliosList.length
    }, { results: this.collection });

    var summaryTable = new SummaryTable(false, { results: this.collection });

    this.showChildView('box', new SummaryBoxView({ model: summaryCount }));

    var filtersLayout = new SummaryFiltersLayout({
      teachersList: teachersList,
      portfoliosList: portfoliosList
    });
    this.showChildView('filters', filtersLayout);

    this.showChildView('results', new SummaryResultsView({
      collection: summaryTable
    }));

    // Set dropdown values if filters were passed in the URL
    if (this.filters.teacher || this.filters.portfolio) {
      if (this.filters.teacher) {
        this.$('select[name="teachers-select"]').val(this.filters.teacher);
        filtersLayout.model.set('teacher', this.filters.teacher);
      }
      if (this.filters.portfolio) {
        this.$('select[name="portfolios-select"]').val(this.filters.portfolio);
        filtersLayout.model.set('portfolio', this.filters.portfolio);
        filtersLayout.model.set('portfolioName', this.$('select[name="portfolios-select"] option:selected').text());
      }
      filtersLayout.triggerMethod('submit:filters', filtersLayout, { model: filtersLayout.model });
    }
  },
  childEvents: {
    "submit:filters": "onFilterSubmit",
    "navigate:filter": "onNavigateFilter"
  },
  onFilterSubmit: function(childView, args) {
    var url = 'summary';

    if (args.model.get('portfolio') === '' && args.model.get('teacher') === '') {
      // we require either a user or portfolio to be selected.
      // just show an alert if that's the case.
      alert('Please select a teacher or portfolio.');
    }

    else {
      console.log('onFilterSubmit model', args.model.toJSON());
      this.collection.fetchFiltered(args.model);

      if (args.model.get('teacher')) {
        url += '/' + args.model.get('teacher');
      }
      else {
        url += '/all';
      }

      if (args.model.get('portfolio')) {
        url += '/' + args.model.get('portfolio');
      }
    }

    // Save the current filters in the URL
    app.router.navigate(url, { trigger: false, replace: true });
  },
  onNavigateFilter: function(childView, filters) {
    console.log('onNavigateFilter', filters);
    var myUrl = "portfolios/" + filters.user_list + "/" + filters.campaign_urn;
    if (filters.survey_id !== false) {
      myUrl += "/" + filters.survey_id;
    }
    app.router.navigate(myUrl, { trigger: true });
  }
});
