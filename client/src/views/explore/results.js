var app = require('../../app');

var ExploreResponseString = JST['templates/explore/responseString.html'];
var ExploreResponseMultichoice = JST['templates/explore/responseMultichoice.html'];
var ExploreResponsePhoto = JST['templates/explore/responsePhoto.html'];
var ExploreResponseDocument = JST['templates/explore/responseDocument.html'];
var ExploreResponseVideo = JST['templates/explore/responseVideo.html'];

var ExploreResultsTemplate = JST['templates/explore/results.html'];


var ExploreResultsEmptyView = Marionette.ItemView.extend({
  tagName: 'tr',
  template: _.template('<td colspan=3>No results for the current filters.</td>')
});

var ResponseStringView = Marionette.ItemView.extend({
  tagName: 'tr',
  template: ExploreResponseString,
  serializeData: function() {
    var data = this.model.toJSON();
    data.prompt_response = data.responseObj.prompt_response;
    return data;
  }
});

var ResponseSinglechoiceView = Marionette.ItemView.extend({
  tagName: 'tr',
  template: ExploreResponseString,
  serializeData: function() {
    var data = this.model.toJSON();
    mySelection = data.responseObj.prompt_response;
    data.prompt_response = data.responseObj.prompt_choice_glossary[mySelection].label;
    return data;
  }
});

var ResponseMultichoiceView = Marionette.ItemView.extend({
  tagName: 'tr',
  template: ExploreResponseMultichoice,
  serializeData: function() {
    var data = this.model.toJSON();

    data.responses = _.map(data.responseObj.prompt_response, function(selectionIndex) {
      return data.responseObj.prompt_choice_glossary[selectionIndex].label;
    });

    return data;
  }
});

var ResponseMediaView = Marionette.ItemView.extend({
  tagName: 'tr',
  serializeData: function() {
    var data = this.model.toJSON();
    var guid = data.responseObj.prompt_response;
    data.id = guid;
    data.media_url = '/app/media/read?client=' + app.config.client + '&id=' + guid;
    data.download_url = data.media_url + '&force_filename=' + guid + '.mp4';
    data.label = this.customLabel;
    return data;
  }
});

var ResponsePhotoView = ResponseMediaView.extend({
  customLabel: 'View Image',
  template: ExploreResponsePhoto
});

var ResponseDocumentView = ResponseMediaView.extend({
  customLabel: 'Download Document',
  template: ExploreResponseDocument
});

var ResponseVideoView = ResponseMediaView.extend({
  customLabel: 'Download Video',
  template: ExploreResponseVideo
});


module.exports = ExploreResultsView = Marionette.CompositeView.extend({
  tagName: 'table',
  className: "table table-striped",
  template: ExploreResultsTemplate,
  emptyView: ExploreResultsEmptyView,
  getChildView: function(model) {
    switch(model.get('responseObj').prompt_type) {
      case 'single_choice':
        return ResponseSinglechoiceView;
      case 'multi_choice':
        return ResponseMultichoiceView;
      case 'photo':
        return ResponsePhotoView;
      case 'document':
        return ResponseDocumentView;
      case 'video':
        return ResponseVideoView;
      default:
        return ResponseStringView;
    }
  },
  childViewContainer: 'tbody',
  collectionEvents: {
    "reset": "render"
  }
});
