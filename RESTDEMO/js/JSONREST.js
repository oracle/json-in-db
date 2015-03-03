
/* ================================================  
 *    
 * Copyright (c) 2015 Oracle and/or its affiliates.  All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ================================================ */

var RENDER_LIMIT = 65536
var UPLOAD_LIMIT = 32768
var SQL_STATEMENT_CACHE;

function loadSQLStatements() {

    var XHR = new XMLHttpRequest();
    XHR.open ("GET", 'js/JSONREST-SQL.json', false);      
    XHR.send(null);

    if (XHR.status == 200) {
      SQL_STATEMENT_CACHE = JSON.parse(XHR.responseText);
    }
     else {
       showErrorMessage('Unable to load SQL statement cache');
    } 
}

function getSQL(targetID,sqlID) {
    
  codeWindow = document.getElementById(targetID + '.SQL');
  codeWindow.innerHTML = "";
  codeWindow.appendChild(document.createTextNode(SQL_STATEMENT_CACHE[sqlID]));

}
  
function loadSourceCode() {
  
  getSQL("sc","listCollection");
  getSQL("cc","createCollection");
  getSQL("dc","dropCollection");
  getSQL("ld","listKeys");
  getSQL("id","postDocument");
  getSQL("pd","putDocument");
  getSQL("gd","getDocument");
  getSQL("dd","deleteDocument");
  getSQL("sd","createCollection");

}


function renderJSON(jsonObject,targetID) {

  var target = document.getElementById(targetID);
  target.innerHTML = "";
 
  jPP.printJson(target,null,jsonObject);

}

function renderJSONText(jsonText,targetID) {
  
  // TODO : add test for really really big text and not create text mode.

  var target = document.getElementById(targetID);
  target.innerHTML = "";
 
   var jsonObject = null
  try {  
    if (jsonText !== '\r\n') {
      jsonObject = JSON.parse(jsonText)
      if (jsonText.length <= RENDER_LIMIT) {
         jPP.printJson(target,null,jsonObject);
      }
      else { 
        target.appendChild(document.createTextNode(jsonText));
      }
    }
  }
  catch (e) {
    target.appendChild(document.createTextNode('Invalid JSON Object detected : \n\n' + jsonText));
  }

}

function renderResponse(XHR,targetID) {
  
   renderJSONText(XHR.responseText,targetID);

}

function showSQLStatement(XHR,targetID) {
	
	try {
		var response = JSON.parse(XHR.responseText);
	  if (response.sqlStatement) {
	  	renderJSON(response.sqlStatement,targetID)
	  }
	}
	catch (e) {}
} 

function showResponse(targetID,XHR,URL,className,method) {
  
  var span = document.getElementById(targetID + ".Method");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(method));

  var span = document.getElementById(targetID + ".URL");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(location.origin + URL));

  var span = document.getElementById(targetID + ".Status");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(XHR.status));
  
  var span = document.getElementById(targetID + ".StatusText");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(XHR.statusText));
  
  renderResponse(XHR,targetID + ".Response")
  showSQLStatement(XHR,targetID + ".SQL");
  
  codeWindow = document.getElementById(targetID + ".Code");
  codeWindow.innerHTML = "";
	var sourceCode = restAPI.getSourceCode(className);
  sourceCode = sourceCode.replace('function','function ' + className);
  codeWindow.appendChild(document.createTextNode(sourceCode));
  
}

function validateCredentials(username,password) {

  if (isEmptyString(username.value)) {
    showErrorMessage('Enter username');
    username.focus();
    return false;
  }

  if (isORDS) {
  	restAPI.setSchema(username.value.toLowerCase());
    doListCollections();
  }
  else {
    if (isEmptyString(password.value)) {
      showErrorMessage('Enter password');
      password.focus();
      return false;
    }

    try {
  
      if (validCredentials(username.value,password.value)) {
         restAPI.setSchema(username.value);
         showSuccessMessage(
         'Connected', 
           /* Set the Select Collection Tab and List the Collections */
           function() {
             doListCollections();
           }
         );
      }
      else {
        showErrorMessage('Unknown Username / Password');
        if (username.disabled) {
          password.focus();
        }
        else {
          username.focus();
        }
        return false;
      }
    } 
    catch (e) {
      handleException('webDemo.validateCredentials',e,null);
    }
  }
}  

function setCollection(collectionName) {
  
  restAPI.setCollectionName(collectionName);
   document.getElementById("dc.CollectionName").value = collectionName;
   document.getElementById("ld.CollectionName").value = collectionName;
   document.getElementById("pd.CollectionName").value = collectionName;
   document.getElementById("gd.CollectionName").value = collectionName;
   document.getElementById("dd.CollectionName").value = collectionName;
   document.getElementById("id.CollectionName").value = collectionName;
   document.getElementById("sd.CollectionName").value = collectionName;
   document.getElementById("bl.CollectionName").value = collectionName;
  
}

function setDocumentId(documentId) {
  
  document.getElementById('pd.DocumentId').value = documentId;
  document.getElementById('gd.DocumentId').value = documentId;
  document.getElementById('dd.DocumentId').value = documentId;
  
}

function doListCollections(collectionName) {
  
  if (getHttpUsername() == "ANONYMOUS") {
    showErrorMessage(
      'Please login',
      function () {
         $('#collectionTab a[href="#Connect"]').tab('show')
       }
    );
    return false;
  }
  
  var callback = function(XHR,URL) {
                   showResponse('sc',XHR,URL,"getCollectionList","GET");
                   var jsonObject = null;
                   try {
                     var optionList = document.getElementById("collectionList")
                     optionList.innerHTML = "";
                     jsonObject = JSON.parse(XHR.responseText);
                     if (jsonObject.items.length > 0) {
                       populateOptionList(optionList,jsonObject.items,"name");
                       if ((typeof collectionName === "undefined") || (collectionName.value == "")) {
                         collectionName = optionList.options[0].value;
                       }
                       setCollection(collectionName);
                       for (var i=0; i < optionList.length; i++) {
                         if (optionList.options[i].value == collectionName) {
                            optionList.options[i].selected = true;
                            break;
                         }
                       }
                     }
                     else {
                       $('#collectionTab a[href="#CreateCollection"]').tab('show')
                     }
                   }
                   catch (e) {
                     showErrorMessage(
                       "Unable to retrieve list of collections", 
                       function () {
                          $('#collectionTab a[href="#CreateCollection"]').tab('show')
                       }
                     );
                   }
                 }

  restAPI.getCollectionList(callback);  
}                    

function checkCollectionName(collectionName) {

  var optionList = document.getElementById("collectionList")
  for (var i=0;i < optionList.options.length; i++) {
    if (optionList.options[i].value == collectionName) {
      return optionList.options[i];
    }
  }
  return null;    
}

function toggleVisibility(targetID,state) {
  
  var target = document.getElementById(targetID);
  
  if (state.checked) {
    target.classList.remove("hidden");
    target.classList.add("show");
  }
  else {
    target.classList.add("hidden");
    target.classList.remove("show");
  }
}

function getCollectionProperties() {
	
	var collectionName = document.getElementById("cc.CollectionName").value;
  var sqlType =  document.getElementById("contentDataType").value;
  var assignmentMethod = document.getElementById("keyAssignment").value;
  return restAPI.createCollectionProperties(collectionName, sqlType, assignmentMethod);
 
}

function setCollectionProperties() {

    var collectionProperties = getCollectionProperties()
    var cpDisplay = document.getElementById("cc.Content")
    cpDisplay.innerHTML = "";
    jPP.printJson(cpDisplay,null,collectionProperties);
    return collectionProperties;

}

function doCreateCollection() {

  var collectionProperties = null;

  var collectionName = document.getElementById("cc.CollectionName")
  
  if ((typeof collectionName.value == "undefined") || (collectionName.value == "")) {
     showErrorMessage("Enter collection name");
     collectionName.focus();
    return;
  }
  
  if (checkCollectionName(collectionName.value) != null) {
    showErrorMessage("Collection Exists");
     collectionName.focus();
    return;
  }
   
  if (document.getElementById("collectionProperties").checked) {
    collectionProperties = setCollectionProperties()
  }
   
  var callback = function(XHR,URL,collectionName) {
                   document.getElementById("cc.CollectionName").value = "";
                   showResponse('cc',XHR,URL,"createCollection","PUT");
                   if (XHR.status == 201) {
                      showSuccessMessage(
                        'Collection Created',
                        function () {
                         doListCollections(collectionName);
                       }
                     )
                   }
                   else if (XHR.status == 200) {
	                    showInformationMessage(
	                      "Collection Exists. Status = " + XHR.status + " (" + XHR.statusText + ")",
                        function () {
                          setCollectionName(collectionName);
                        }
                      )
                   }
                   else {
                      showErrorMessage(
                        "Create Collection Failed. Status = " + XHR.status + " (" + XHR.statusText + ")",
                        function() {
                        	doListCollections();
                        }
                      );
                   }
  }
                         
  restAPI.createCollection(collectionName.value,collectionProperties,callback);                         
}

function validateCollectionName(collectionName) {

  if ((typeof collectionName.value == "undefined") || (collectionName.value == "")) {
    showErrorMessage(
       "Select collection",
      function () {
         doListCollections()
       }
    );
    return false;
  }
  return true;
}

function doDropCollection() {

  var collectionName = document.getElementById("dc.CollectionName")
  var valid = validateCollectionName(collectionName);
  
  if (valid) {
  
    var callback = function(XHR,URL,collectionName) {
                     showResponse('dc',XHR,URL,"dropCollection","DELETE");
                     if (XHR.status == 200) {
                        showSuccessMessage(
                          'Collection Dropped',
                          function () { 
                            document.getElementById("dc.CollectionName").value = "";
                            doListCollections();
                          }
                       )
                     }
                     else {
                        showErrorMessage(
                          "Drop Collection Failed. Status = " + XHR.status + " (" + XHR.statusText + ")",
                         function () {
                           document.getElementById("dc.CollectionName").value = "";
                           doListCollections();
                         }
                       )
                     }
    }                           
    restAPI.dropCollection(callback);                         
  }
    
}

function addArgument(args,argName,argValue) {
  
  if (args !== "") {
    args = args + "&";
  }
  
  args = args + argName + "=" + argValue;
  
  return args;

}

function doListDocuments() {

  var args = "";

  var collectionName = document.getElementById("ld.CollectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {

    var limitCount = document.getElementById('ld.DocumentLimit');

    if ((typeof limitCount.value == "undefined") || (limitCount.value == "")) {
    }
    else {
      args = addArgument(args,'limit',limitCount.value);
    }

    args = addArgument(args,'fields',document.getElementById("ld.fieldList").value);
   
    var callback = function(XHR,URL) {
                     showResponse('ld',XHR,URL,"getCollection","GET");
                     if (XHR.status == 200) {
                       var jsonObject = null;
                       try {
		                     var optionList = document.getElementById("ld.documentList")
    		                 optionList.innerHTML = "";
                         jsonObject = JSON.parse(XHR.responseText);
                         if (jsonObject.items.length > 0) {
                           populateOptionList(optionList,jsonObject.items,"id");
                           optionList.options[0].selected = true;                     
                           setDocumentId(optionList.options[0].value);
                           showSuccessMessage(jsonObject.items.length + " documents found.");
                         }
                         else {
                           showErrorMessage("Empty Collection");
                         }
                       }
                       catch (e) {
                         showErrorMessage("Error processing document list");
                       }
                     }
                     else {
                       showErrorMessage("Unable to Fetch Document. Status = " + XHR.status + " (" + XHR.statusText + ")");
                     }
    } 
    restAPI.getCollection(args,callback);                         
  }
}

function validateDocumentId(documentId) {

  if ((typeof documentId.value == "undefined") || (documentId.value == "")) {
    showErrorMessage(
       "Enter Document ID"
    );
    documentId.focus();
    return false;
  }
  return true;
 
}

function renderJsonContent(reader,documentCache,target) {
  
  target.innerHTML = ""
  
  if (reader.result.length >= UPLOAD_LIMIT) {
    showErrorMessage('Upload currently limited to 32K');
    return
  }
  
  try {
    documentCache.value = reader.result;

    jsonObject = JSON.parse(reader.result)
    if (reader.result.length <= RENDER_LIMIT) {
        jPP.printJson(target,null,jsonObject);
    }
    else { 
      target.appendChild(document.createTextNode(reader.result));
     }
  }
  catch (e) {
    target.appendChild(document.createTextNode('Invalid JSON Object detected : \n\n' + reader.result));
     showErrorMessage("Invalid JSON Document");
  }
}

function checkFileExtension(name,extension) {
  
  var uname = name.toUpperCase();
  var uext  = extension.toUpperCase();
  return uname.indexOf(uext, uname.indexOf - uext.length) !== -1
}

function doLoadFile(fileControl,cache,target) {
  
  var file = fileControl.files[0];
    
  if ((file.type == "application/json") || ((file.type == "") && (checkFileExtension(file.name,'.json')))) {
    var fr = new FileReader();
    fr.onloadend = function () {
                     renderJsonContent(fr,cache,target);
     }
    fr.readAsText(file);
  }
  else {
    showErrorMessage("Select a JSON Document");
    fileControl.focus();
    return;
  }
      
}
  
function isEmpty(targetID) {

  var target = document.getElementById(targetID);

  if ((typeof target.value == "undefined") || (target.value == "")) {
    return true;
  }
  return false;

}
  
function doInsertDocument() {

  var collectionName = document.getElementById("id.CollectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {

    if (isEmpty('id.Cache')) {
      showErrorMessage("Load document content");
      return
    }      

    var callback = function(XHR,URL) {
                     showResponse('id',XHR,URL,"postDocument","POST");
                     if (XHR.status == 201) {
                        showSuccessMessage(
                          'Document Created',
                          function () {
                          doListDocuments();
                        }
                      )
                     }
                     else {
                        showErrorMessage("Create Document Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                     }
    } 
    restAPI.postDocument(null,JSON.parse(document.getElementById('id.Cache').value),callback);                         
  }
}

function doUpdateDocument() {

  var collectionName = document.getElementById("pd.CollectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    var documentId = document.getElementById("pd.DocumentId")
    valid = validateDocumentId(documentId);

    if (valid) {
      
      if (isEmpty('pd.Cache')) {
        showErrorMessage("Load replacement content");
        return
      }      
    
      var callback = function(XHR,URL) {
                       showResponse('pd',XHR,URL,"putDocument","PUT");
                       if (XHR.status == 200) {
                          showSuccessMessage(
                            'Document Updated'
                         )
                       }
                       else if (XHR.status == 201) {
                          showSuccessMessage(
                            'Document Created',
                            function () {
                             doListDocuments();
                           }
                         )
                       }
                       else {
                          showErrorMessage("Update Document Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                       }
      } 
      restAPI.putDocument(documentId.value,JSON.parse(document.getElementById('pd.Cache').value),callback);                         
    }
  }
  
}

function doGetDocument() {

  var collectionName = document.getElementById("gd.CollectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    var documentId = document.getElementById("gd.DocumentId")
    valid = validateDocumentId(documentId);
    
    if (valid) {
      var callback = function(XHR,URL) {
                       showResponse('gd',XHR,URL,"getDocument","GET");
                       if (XHR.status == 200) {
                         renderResponse(XHR,'gd.Content')
                       }
                       else {
                          showErrorMessage("Unable to Fetch Document. Status = " + XHR.status + " (" + XHR.statusText + ")");
                       }
      } 
      restAPI.getDocument(documentId.value,callback);                         
    }
  }

}

function doDeleteDocument() {

  var collectionName = document.getElementById("dd.CollectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    var documentId = document.getElementById("dd.DocumentId")
    valid = validateDocumentId(documentId);

    if (valid) {
      var callback = function(XHR,URL) {
                       showResponse('dd',XHR,URL,"deleteDocument","DELETE");
                        if (XHR.status == 200) {
                          showSuccessMessage(
                            'Document Deleted',
                            function () { 
                             document.getElementById("dd.DocumentId").value = "";
                              doListDocuments();
                            }
                         )
                       }
                       else {
                          showErrorMessage(
                            "Delete Failed. Status = " + XHR.status + " (" + XHR.statusText + ")",
                           function () {
                             document.getElementById("dd.DocumentId").value = "";
                             doListDocuments();
                           }
                         )
                       }
      }    
      restAPI.deleteDocument(documentId.value,callback);                         
    }
  }
}


function doSearchCollection() {

  var collectionName = document.getElementById("sd.CollectionName")
  var valid = validateCollectionName(collectionName);
  if (valid) {
    
    if (isEmpty('sd.Cache')) {
      showErrorMessage("Load valid QBE document");
      return
    }      
        
    var callback = function(XHR,URL) {
                     showResponse('sd',XHR,URL,"postDocument","POST");
                     // generateSQL(URL)
                     if (XHR.status == 200) {
                       var jsonObject = null;
                       try {
                          jsonObject = JSON.parse(XHR.responseText);
                       }
                       catch (e) {jsonObject = null};
                       var optionList = document.getElementById("sd.documentList")
                       var optionList2 = document.getElementById("sd.ReferenceList")
                       optionList.innerHTML = "";
                       if  (jsonObject != null) {
                         if (jsonObject.items.length > 0) {
                           populateOptionList(optionList,jsonObject.items,"id");
                             optionList.options[0].selected = true;
                           populateOptionList2(optionList2,jsonObject.items,"id",jsonObject.items,"value.Reference");
                             optionList.options[0].selected = true;
                           showSuccessMessage(jsonObject.items.length + " documents found.");
                          }
                         else {
                           showErrorMessage("No Matching Documents");
                         }
                       }
                       else {
                         showErrorMessage("Error processing document list");
                       }
                     }
                     else {
                       showErrorMessage("Query By Example Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                     }
    } 
    restAPI.postDocument('action=query&sqlStatement=true&keyPositions=true',JSON.parse(document.getElementById('sd.Cache').value),callback);                  
  }
}

function renderArrayContent(reader,documentCache,target) {
  
  try {
    documentCache.value = reader.result;
    var jsonObject = JSON.parse(reader.result);
    target.innerHTML = "";
    target.innerHTML = jsonObject.length + " objects ready for loading";
   }
   catch (e) {showErrorMessage("Invalid JSON Document")};

}


function doLoadArray(fileControl,cache,target) {
  
  var file = fileControl.files[0];
    
  if ((file.type == "application/json") || ((file.type == "") && (checkFileExtension(file.name,'.json')))) {
    var fr = new FileReader();
    fr.onloadend = function () {
                     renderArrayContent(fr,cache,target);
     }
    fr.readAsText(file);
  }
  else {
    showErrorMessage("Select a JSON Document");
    fileControl.focus();
    return;
  }
      
}

function doBulkLoad() {

  var collectionName = document.getElementById("bl.CollectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    
    if (isEmpty('bl.Cache')) {
      showErrorMessage("Load JSON Array");
      return
    }      

    var callback = function(XHR,URL) {
                     showResponse('bl',XHR,URL,"postDocument","POST");
                     if (XHR.status == 200) {
                        var count = JSON.parse(XHR.responseText).items.length
                        showSuccessMessage(
                          'Bulk Load Successful: ' + count + ' Documents loaded',
                          function () {
                          doListDocuments();
                        }
                      )
                     }
                     else {
                        showErrorMessage("Bulk Load Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                     }
    } 
    restAPI.postDocument('action=insert',JSON.parse(document.getElementById('bl.Cache').value),callback);                         
  }
}

function init() {

  try {
    initCommon();
    loadSQLStatements()
    loadSourceCode()
    setCollectionProperties()
    if (isORDS) {
		  restAPI.setORDS();
		  restAPI.setSchema("scott");
		  var pwd = document.getElementById("sqlPassword");
		  pwd.parentNode.removeChild(pwd);
    }
    else {
    	restAPI.setServletRoot('/DBJSON');
    }
  }
  catch (e) {
    handleException('JSONREST.init',e,null);
  }
}