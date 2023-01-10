module.exports = {
  getData: require('./server/getData').handler,
  getDocumentJSON: require('./server/getDocumentJSON').handler,
  getFolderDocuments: require('./server/getFolderDocuments').handler,
};
