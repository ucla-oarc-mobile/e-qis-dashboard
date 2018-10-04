module.exports = config = {
  client: 'e-qis-web',
  dayMax: 10,
  portfolioWhitelist: [
    'urn:campaign:tpp:internal:eqissurveys5',
    'urn:campaign:tpp:internal:eqissurveys6',
    'urn:campaign:tpp:internal:eqissurveys7'
  ],
  responseDayFolders: [
    'InstructionalArtifactDayFolder',
    'AssessmentArtifactDayFolder'
  ],
  // These responses will be flagged as modifications
  modificationResponseNames: [
    '12ModificationDocument',
    '12ModificationImage',
    '8InstructionModificationDocument',
    '8InstructionModificationImage'
  ],
  // These responses will be completely ignored everywhere
  responseBlacklist: {
    '1InitialReflection': [
      '1WhatToDo',
      '2MMaterialType',
      '2MUploadSecondImage',
      '2MUploadThirdImage',
      '2MUpload4thImage',
      '2MUpload5thImage',
      '2NUpload2ndDoc',
      '2NUpload3rdDoc',
      '2NUpload4thDoc',
      '2NUpload5thDoc'
    ],
    '2AssessmentArtifacts': [
      '3MaterialType',
      'UploadSecondAssessmentImage',
      'UploadThirdAssessmentImage',
      'Upload4thAssessmentImage',
      'Upload5thAssessmentImage',
      'Upload2ndAssessmentDoc',
      'Upload3rdAssessmentDoc',
      'Upload4thAssessmentDoc',
      'Upload5thAssessmentDoc'
    ],
    '3InstructionArtifacts': [
      '3InstructionMaterialType',
      '2ndInstructionImageOption',
      '3rdInstructionImageOption',
      '4thInstructionImageOption',
      '5thInstructionImageOption',
      '2ndInstructionDocOption',
      '3rdInstructionDocOption',
      '4thInstructionDocOption',
      '5thInstructionDocOption'
    ],
    '4ConcludingReflection': [
      '1WhatToDoConclusion',
      '2IConcludingMaterialType',
      '2IUploadSecondImage',
      '2IUploadThirdImage',
      '2IUpload4thImage',
      '2IUpload5thImage',
      '2IUpload2ndDoc',
      '2IUpload3rdDoc',
      '2IUpload4thDoc',
      '2IUpload5thDoc'
    ]
  }
};
