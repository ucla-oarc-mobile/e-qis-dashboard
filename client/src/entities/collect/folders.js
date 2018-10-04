var app = require('../../app');
var oh = require('../../oh');

var CollectFolder = require('./folder');

module.exports = CollectFolders = Backbone.Collection.extend({
  model: CollectFolder,
  initialize: function(portfolio) {
    this.portfolio = portfolio;

    oh.response.read_custom({
      user_list: app.user.get('username'),
      campaign_urn: this.portfolio
    }).done(function(data) {
      this.reset(data, { parse: true });
    }.bind(this));
  },
  parse: function(data) {
    var folderCounts = { '1InitialReflection': 0, '4ConcludingReflection': 0 };

    for (var i = 1; i <= app.config.dayMax; i++) {
      folderCounts[i] = 0;
    }

    _.each(data, function(response) {
      var folder = '';

      if (response.survey_id === '2AssessmentArtifacts') {
        folder = response.responses['AssessmentArtifactDayFolder'].prompt_response;
      }
      else if (response.survey_id === '3InstructionArtifacts') {
        folder = response.responses['InstructionalArtifactDayFolder'].prompt_response;
      }
      else {
        folder = response.survey_id;
      }

      folderCounts[folder]++;
    });

    var folderData = [];
    folderData.push({ survey: '1InitialReflection', folder: 'Initial', collected: folderCounts['1InitialReflection'], link: '#my-portfolio/' + this.portfolio + '/1InitialReflection' });
    for (i = 1; i <= app.config.dayMax; i++) {
      folderData.push({ day: i, folder: 'Day ' + app.zeroPad(i, 2), collected: folderCounts[i], link: '#my-portfolio/' + this.portfolio + '/day' + i });
    }
    folderData.push({ survey: '4ConcludingReflection', folder: 'Concluding', collected: folderCounts['4ConcludingReflection'], link: '#my-portfolio/' + this.portfolio + '/4ConcludingReflection' });

    return folderData;
  }
});
