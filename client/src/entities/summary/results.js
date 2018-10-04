var oh = require('../../oh');

var app = require('../../app');

module.exports = SummaryResults = Backbone.Collection.extend({
  initQueue: function() {
    // the primary request queue for this object.
    this.myDeferred = new $.Deferred();
    // list of campaign URNs to feed into the request queue.
    this.campaign_urns = [];

    // ensure the collection is empty.
    this.reset();
  },
  parse: function(rows, options) {
    var result = [], groups = [];

    // first, group the rows by user.
    groups = _.groupBy(rows, function(row) {
      return row.user;
    });

    result = _.map(groups, function(group, user) {
      // loop through each user group.
      var rowCounts = {};
      rowCounts = _.countBy(group, function(response) {
        // get counts for all rows.
        var type = '';
        switch(response.survey_id) {
          case "1InitialReflection":
            type = 'initialCount';
          break;
          case "2AssessmentArtifacts":
            type = 'assessmentCount';
          break;
          case "3InstructionArtifacts":
            type = 'instructionCount';
          break;
          case "4ConcludingReflection":
            type = 'concludingCount';
          break;
        }
        return type;

      });
      return _.extend({user: user, campaign_urn: options.portfolioId, portfolio: options.portfolioName, totalCount: group.length}, rowCounts);
    });
    return result;
  },
  readCampaignResponses: function(params, options) {

    oh.response.read_custom(params).done(function(responseData) {
      if (responseData.length > 0) {
        // ignore empty results.

        // add this campaign's results to the collection for parsing.
        this.add(responseData, {
          parse: true,
          portfolioName: options.portfolioName,
          portfolioId: params.campaign_urn
        });

      }
    }.bind(this))
    .always(function() {

      // always resolve the corresponding campaign queue item.
      urnIndex = this.campaign_urns.indexOf(params.campaign_urn);
      this.myDeferred[urnIndex].resolve();

    }.bind(this));
  },
  fetchFiltered: function(model) {
    var read_params = {}, user_list = false, campaign_urn = false, portfolioNames = [];

    this.waitTimeout = false;
    // reset the queue.
    this.initQueue();

    if (model.get('teacher') !== '') {
      // user_list defaults to false so the `oh` API
      // can use its handler to fetch global user list
      user_list = model.get('teacher');
    }
    if (model.get('portfolio') === '') {
      // None selected, get all campaigns.
      this.campaign_urns = _.map( app.user.get('campaigns'), function(value, key) { return key; } );
      portfolioNames = _.map( app.user.get('campaigns'), function(value, key) { return value; } );
    } else {
      // set it to a single campaign.
      this.campaign_urns = [model.get('portfolio')];
      portfolioNames = [model.get('portfolioName')];
    }


    // generate an array of Deferred objects from the results.
    this.myDeferred = _.map( this.campaign_urns, function() { return new $.Deferred(); });

    this.waitTimeout = window.setTimeout( function() {
      window.wait('Fetching Portfolio Details...');
    }, 500);

    $.when.apply($, this.myDeferred).done(function() {
      // trigger refresh after all items in the queue have resolved.
      // close any modals

      $('#modalPermanent').modal('hide');

      if (this.waitTimeout !== false) {
        window.clearTimeout(this.waitTimeout);
        this.waitTimeout = false;
      }

      this.trigger('refresh', this);
    }.bind(this));

    _.each(this.campaign_urns, function(urn, index) {
      // call each item in the queue.
      this.readCampaignResponses({campaign_urn: urn, user_list: user_list}, {portfolioName: portfolioNames[index]});
    }.bind(this));
  }
});
