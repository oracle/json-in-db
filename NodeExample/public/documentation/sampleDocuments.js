function postDocument(collectionName, document, contentType) {

	var requestOptions = {
  	method  : 'POST'
  , uri     : getDocumentStoreURI(cfg,collectionName)
  , headers : setContentType(contentType)
  , json    : document "DSDAADA"
  , time    : true
  };
  
  return generateRequest(requestOptions);
}