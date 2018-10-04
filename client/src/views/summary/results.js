var SummaryResultsRowTemplate = JST['templates/summary/resultsRow.html'];
var SummaryResultsTemplate = JST['templates/summary/results.html'];

var SummaryResultsEmptyView = Marionette.ItemView.extend({
  tagName: 'tr',
  template: _.template('<td colspan="7">No results, select options to apply.</td>')
});


var SummaryResultsRowView = Marionette.ItemView.extend({
  tagName: 'tr',
  template: SummaryResultsRowTemplate,
  triggers: {
    "click .initial .btn-link": "navigate:initial",
    "click .instruction .btn-link": "navigate:instruction",
    "click .assessment .btn-link": "navigate:assessment",
    "click .concluding .btn-link": "navigate:concluding",
    "click .total .btn-link": "navigate:total"
  }
});

module.exports = SummaryResultsView = Marionette.CompositeView.extend({
  tagName: 'table',
  className: "table summary-table",
  template: SummaryResultsTemplate,
  childView: SummaryResultsRowView,
  emptyView: SummaryResultsEmptyView,
  childViewContainer: 'tbody',
  childEvents: {
    "navigate:initial": "onNavigateInitial",
    "navigate:instruction": "onNavigateInstruction",
    "navigate:assessment": "onNavigateAssessment",
    "navigate:concluding": "onNavigateConcluding",
    "navigate:total": "onNavigateTotal"
  },
  navigateFilter: function(model, survey_id) {
    var myFilters = {
      user_list: model.get('user'),
      campaign_urn: model.get('campaign_urn'),
      survey_id: survey_id
    };
    console.log('navigateFilter model and survey ID', model, survey_id);
    // passing this event up to the main Layout,
    // since it's behaving more like a Controller.
    this.triggerMethod('navigate:filter', myFilters);
  },
  onNavigateInitial: function(childView, args) {
    this.navigateFilter(args.model, "1InitialReflection");
  },
  onNavigateAssessment: function(childView, args) {
    this.navigateFilter(args.model, "2AssessmentArtifacts");
  },
  onNavigateInstruction: function(childView, args) {
    this.navigateFilter(args.model, "3InstructionArtifacts");
  },
  onNavigateConcluding: function(childView, args) {
    this.navigateFilter(args.model, "4ConcludingReflection");
  },
  onNavigateTotal: function(childView, args) {
    this.navigateFilter(args.model, false);
  },
  collectionEvents: {
    "reset": "render"
  }
});
