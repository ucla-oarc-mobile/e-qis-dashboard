var SummaryFiltersDropdown = Marionette.ItemView.extend({
  tagName: "option",
  template: _.template('<%= label %>'),
  attributes: function() { return { value: this.model.get('value') }; }
});

var SummaryFiltersTeachersView = Marionette.CollectionView.extend({
  tagName: "select",
  className: "form-control",
  childView: SummaryFiltersDropdown,
  attributes: { name: "teachers-select" },
  initialize: function(options) {
    options.collection.add([{value: "", label: "All Teachers"}], {at: 0});
    this.collection = options.collection;
  },
  triggers: {
    "change": "select:teacher"
  },
});

var SummaryFiltersPortfoliosView = Marionette.CollectionView.extend({
  tagName: "select",
  className: "form-control",
  childView: SummaryFiltersDropdown,
  attributes: { name: "portfolios-select" },
  initialize: function(options) {
    options.collection.add([{value: "", label: "All Portfolios"}], {at: 0});
    this.collection = options.collection;
  },
  triggers: {
    "change": "select:portfolio"
  },
});


module.exports = SummaryFiltersLayout = Marionette.LayoutView.extend({
  className: "filters row",
  initialize: function() {
    this.model = new Backbone.Model({'teacher': '', 'portfolio': '', 'portfolioName': '' });
  },
  template: _.template('<div class="col-sm-3 form-group"><label>Teacher(s):</label><span id="teachers-filter"></span></div><div class="col-sm-3 form-group"><label>Portfolio(s):</label><span id="portfolios-filter"></span></div>'),
  regions: {
    teachers: "#teachers-filter",
    portfolios: "#portfolios-filter"
  },
  onBeforeShow: function() {
    this.showChildView('teachers', new SummaryFiltersTeachersView({ collection: this.getOption("teachersList") }));
    this.showChildView('portfolios', new SummaryFiltersPortfoliosView({ collection: this.getOption("portfoliosList") }));

  },
  triggers: {
    "click button": "submit:filters"
  },
  childEvents: {
    "select:teacher": "onTeacherSelect",
    "select:portfolio": "onPortfolioSelect"
  },
  onTeacherSelect: function(childView, args) {
    var teacherName = args.view.$el.val();
    console.log("SummaryFiltersLayout onTeacherSelect", teacherName);
    this.model.set('teacher', teacherName);
    this.triggerMethod('submit:filters', this, { model: this.model });
  },
  onPortfolioSelect: function(childView, args) {
    var portfolioName = false, portfolioId = args.view.$el.val();
    if (portfolioId !== '') {
      portfolioName = args.view.$el.find('option:selected').text();
    }
    console.log("SummaryFiltersLayout onPortfolioSelect", portfolioId);
    this.model.set('portfolio', portfolioId);
    this.model.set('portfolioName', portfolioName);
    this.triggerMethod('submit:filters', this, { model: this.model });
  }
});
