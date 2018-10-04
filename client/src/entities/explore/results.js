var oh = require('../../oh');

var app = require('../../app');

module.exports = ExploreResults = Backbone.Collection.extend({
  parse: function(rows, options) {
    var result = [];

    // Each row is a survey response.
    // these must be expanded by prompt responses and flattened.
    _.each(rows, function(responseRow) {
      var responses = responseRow.responses;
      var user = responseRow.user;
      var survey_id = responseRow.survey_id;

      var dayFolderList = app.config.responseDayFolders;
      var day_folder = '';
      var sort_day;

      // Day folder is 'initial' or 'concluding' if the row is from one of those surveys
      if (survey_id === '1InitialReflection') {
        day_folder = 'Initial';
        sort_day = 0;
      }
      else if (survey_id === '4ConcludingReflection') {
        day_folder = 'Concluding';
        sort_day = 9999;
      }

      // Otherwise, sift through the responses to find the folder
      else {
        day_folder = _.reduce(responses, function(memo, response, prompt_id) {
          if (memo === '' && _.contains(dayFolderList, prompt_id)) {
            memo = response.prompt_response;
          }
          return memo;
        }, '');
        sort_day = day_folder;
      }

      var mediatype = _.reduce(responses, function(memo, response, prompt_id) {
        if (memo === 'text' && _.contains(['photo', 'document', 'video'], response.prompt_type) && !_.contains(["NOT_DISPLAYED", "SKIPPED"], response.prompt_response)) {
          memo = response.prompt_type;
        }
        return memo;
      }, 'text');

      var blacklist = app.config.responseBlacklist[survey_id];

      _.each(responses, function(response, prompt_id) {
        // Ignore falsy responses
        if (_.contains(["NOT_DISPLAYED", "SKIPPED"], response.prompt_response)) { return false; }

        // Ignore blacklisted responses
        if (_.contains(blacklist, prompt_id)) { return false; }

        // Add filters based on params
        if (options.artifact !== false && survey_id !== options.artifact) { return false; }
        if (options.question !== false && prompt_id !== options.question) { return false; }
        if (options.mediatype !== false && mediatype !== options.mediatype) { return false; }

        result.push({
          user: user,
          portfolio: options.portfolio_id,
          artifact: survey_id,
          question_id: prompt_id,
          day_folder: day_folder,
          mediatype: mediatype,
          question: response.prompt_text,
          responseObj: response,
          sort_day: sort_day,
          timestamp: responseRow.utc_timestamp
        });
      });

    });

    console.log('total number of result rows:', result.length);

    // Sort by day folder, then by survey timestamp, then by prompt_index
    result.sort(function(x, y) {
      if (x.sort_day > y.sort_day) {
        return 1;
      }
      else if (x.sort_day < y.sort_day) {
        return -1;
      }
      else {
        if (x.timestamp > y.timestamp) {
          return 1;
        }
        else if (x.timestamp < y.timestamp) {
          return -1;
        }
        else {
          return x.responseObj.prompt_index > y.responseObj.prompt_index ? 1 : -1;
        }
      }
    });

    return result;
  },
  readCampaignResponses: function(params, options) {

    oh.response.read_custom(params).done(function(responseData) {

      // close any modals
      $('#modalPermanent').modal('hide');

      if (this.waitTimeout !== false) {
        window.clearTimeout(this.waitTimeout);
        this.waitTimeout = false;
      }


      if (responseData.length > 0) {

        this.reset(responseData, {
          parse: true,
          portfolio_id: params.campaign_urn,
          artifact: options.artifact,
          question: options.question,
          mediatype: options.mediatype
        });

        this.trigger('refresh', this);
      } else {
        this.reset();
        this.trigger('refresh', this);
      }
    }.bind(this));
  },
  fetchFiltered: function(model) {
    var read_params = {},
    user_list = false,
    campaign_urn = false,
    artifact = false,
    question = false,
    mediatype = false;

    this.waitTimeout = false;

    if (model.get('teacher') !== '') {
      user_list = model.get('teacher');
    }
    if (model.get('portfolio') !== '') {
      campaign_urn = model.get('portfolio');
    }
    if (model.get('artifact') !== '') {
      artifact = model.get('artifact');
    }
    if (model.get('question') !== '') {
      question = model.get('question');
    }
    if (model.get('mediatype') !== '') {
      mediatype = model.get('mediatype');
    }

    this.waitTimeout = window.setTimeout( function() {
      window.wait('Fetching Portfolio Details...');
    }, 500);

    this.readCampaignResponses( {campaign_urn: campaign_urn, user_list: user_list},
      {
        campaign_urn: campaign_urn,
        artifact: artifact,
        question: question,
        mediatype: mediatype
      }
    );

  }
});
