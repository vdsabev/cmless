module.exports = {
  getData: require('./api/getData').handler,
  getDocumentJSON: require('./api/getDocumentJSON').handler,
  getFolderDocuments: require('./api/getFolderDocuments').handler,
};
