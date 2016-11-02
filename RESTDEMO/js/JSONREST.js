
/* ================================================  
 *    
 * Copyright (c) 2016 Oracle and/or its affiliates.  All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * ================================================
 */

var RENDER_LIMIT = 65536
var UPLOAD_LIMIT = 32768

var sqlGenerator = new SqlGenerator()

var serviceList = [
      sqlGenerator.CREATE_COLLECTION,
      sqlGenerator.LIST_COLLECTIONS,
      sqlGenerator.DROP_COLLECTION,
      sqlGenerator.POST_DOCUMENT,
      sqlGenerator.GET_DOCUMENT,
      sqlGenerator.UPDATE_DOCUMENT,
      sqlGenerator.DELETE_DOCUMENT, 
      sqlGenerator.LIST_KEYS,
      // sqlGenerator.LIST_DOCUMENTS,
      sqlGenerator.BULK_INSERT,
      sqlGenerator.QUERY_BY_EXAMPLE
    ]

function getSQL(serviceId,sqlID) {
    
  codeWindow = document.getElementById(serviceId + '.SQL');
  codeWindow.innerHTML = "";
  codeWindow.appendChild(document.createTextNode(sqlGenerator.getStatement(sqlID)));
  
}
  
function renderJSON(jsonObject,serviceId) {

  var target = document.getElementById(serviceId);
  target.innerHTML = "";
 
  jPP.printJson(target,null,jsonObject);

}

function renderJSONText(jsonText,serviceId) {
  
  // TODO : add test for really really big text and not create text mode.

  var target = document.getElementById(serviceId);
  target.innerHTML = "";
 
  var jsonObject = null
  try {  
    if ((jsonText.length > 0) && (jsonText !== 'h')) {
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

function renderResponse(XHR,serviceId) {
  
   renderJSONText(XHR.responseText,serviceId);

}

function clearSQLResults(serviceId) {
	
	document.getElementById(serviceId + ".1.result").innerHTML = "";

}

function showSQLStatement(serviceId,XHR,URL) {
	
	var sqlWindowId = serviceId + ".SQL"
	
	if (serviceId === sqlGenerator.QUERY_BY_EXAMPLE) {
  	try {
	  	var response = JSON.parse(XHR.responseText);
	    if (response.sqlStatement) {
	  	  renderJSON(response.sqlStatement,sqlWindowId)
	    }
	  }
  	catch (e) {}
  }
  else {
  	var sqlWindow = document.getElementById(sqlWindowId);
	  sqlWindow.innerHTML = "";
	  sqlWindow.appendChild(document.createTextNode(sqlGenerator.getSQLStatement(serviceId,XHR,URL)));
  }
} 

function showResponse(serviceId,XHR,URL,className,method) {
  
  if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
  }
  
  var span = document.getElementById(serviceId + ".Method");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(method));

  var span = document.getElementById(serviceId + ".URL");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(location.origin + URL));

  var span = document.getElementById(serviceId + ".Status");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(XHR.status));
  
  var span = document.getElementById(serviceId + ".StatusText");
  span.innerHTML = "";
  span.appendChild(document.createTextNode(XHR.statusText));
  
  var span = document.getElementById(serviceId + ".Headers");
  span.innerHTML = "";
  var headers = XHR.getAllResponseHeaders();
  for (var i = 0; i < headers.length; i++) {
  	span.appendChild(document.createTextNode(headers[i]));
	}  	
  	
  renderResponse(XHR,serviceId + ".Response")
  showSQLStatement(serviceId,XHR,URL);
  
  codeWindow = document.getElementById(serviceId + ".Code");
  codeWindow.innerHTML = "";
	var sourceCode = restAPI.getSourceCode(className);
  sourceCode = sourceCode.replace('function','function ' + className);
  codeWindow.appendChild(document.createTextNode(sourceCode));

}

function setVisibility(visible,target) {
    
  if (visible) {
    target.classList.remove("hidden");
    target.classList.add("show");
  }
  else {
    target.classList.add("hidden");
    target.classList.remove("show");
  }
}


function toggleVisibility(checkbox,target) {
    
  setVisibility(checkbox.checked,target);

}

function validateCredentials(username,password) {

  if (isEmptyString(username.value)) {
    showErrorMessage('Enter username');
    username.focus();
    // return false;
  }

  if (isORDS) {
  	restAPI.setSchema(username.value.toLowerCase());
    doListCollections();
  }
  else {
    if (isEmptyString(password.value)) {
      showErrorMessage('Enter password');
      password.focus();
      // return false;
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
  document.getElementById(sqlGenerator.DROP_COLLECTION  + ".collectionName").value = collectionName;
  document.getElementById(sqlGenerator.LIST_KEYS        + ".collectionName").value = collectionName;
  document.getElementById(sqlGenerator.POST_DOCUMENT    + ".collectionName").value = collectionName;
  document.getElementById(sqlGenerator.GET_DOCUMENT     + ".collectionName").value = collectionName;
  document.getElementById(sqlGenerator.UPDATE_DOCUMENT  + ".collectionName").value = collectionName;
  document.getElementById(sqlGenerator.DELETE_DOCUMENT  + ".collectionName").value = collectionName;
  document.getElementById(sqlGenerator.QUERY_BY_EXAMPLE + ".collectionName").value = collectionName;
  document.getElementById(sqlGenerator.BULK_INSERT      + ".collectionName").value = collectionName;
  
}

function setDocumentId(documentId) {
  
  document.getElementById(sqlGenerator.UPDATE_DOCUMENT + ".DocumentId").value = documentId;
  document.getElementById(sqlGenerator.GET_DOCUMENT    + ".DocumentId").value = documentId;
  document.getElementById(sqlGenerator.DELETE_DOCUMENT + ".DocumentId").value = documentId;
  
}

function resetListCollections() {
	
	clearSQLResults(sqlGenerator.LIST_COLLECTIONS);
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
                   showResponse(sqlGenerator.LIST_COLLECTIONS,XHR,URL,"getCollectionList","GET");
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
  resetListCollections();
  
}   
function generateSequenceName(collectionName) {
	
	return "ID$" + collectionName.substring(0,27)

}

function validateNewCollectionName(serviceId) {
	
  var collectionName = document.getElementById(serviceId + ".collectionName");

  if (collectionName.oldValue != collectionName.value) {
    if (collectionName.value != "") {
    	var optionList = document.getElementById("collectionList")
      for (var i=0;i < optionList.options.length; i++) {
        if (optionList.options[i].value == collectionName.value) {
          showErrorMessage(
            "Collection Exists",
            function() {
		          collectionName.focus();
            }
          )
        } 
      }
      document.getElementById(serviceId + ".sequenceName").value = generateSequenceName(collectionName.value)
    }  
  }
}

function chgCollectionName(inputField,serviceId) {

	var cp  = document.getElementById(serviceId + ".collectionProperties")
	var cpd = document.getElementById()
	
	if ((typeof collectionName.value == "undefined") || (collectionName.value.trim() == "")){
		cp.checked  = false;
		setVisibility(false,cpd);
  }
  else {
		setVisibility(true,cpd);
  }
}

function rqdCollectionName(serviceId) {
	
  var collectionName = document.getElementById(serviceId + ".collectionName");

  if ((typeof collectionName.value == "undefined") || (collectionName.value.trim() == "")) {
    showErrorMessage(
      "Enter collection name",
      function(collectionName) {
		    collectionName.focus();
      }(collectionName)
    )
    return false;
  }
}	

function chkCollectionName(serviceId) {

	var collectionName = document.getElementById(serviceId + ".collectionName");

  if ((typeof collectionName.value == "undefined") || (collectionName.value.trim() == "")) {
  	return false;
 	}

}

function showCustomPropertiesDialog(serviceId,checkbox) {
	
	var collectionName = document.getElementById(serviceId + ".collectionName");
 
  if ((typeof collectionName.value == "undefined") || (collectionName.value.trim() == "")) {
  	return false;
 	}
 	
  toggleVisibility(checkbox,document.getElementById(serviceId + ".collectionPropertiesDialog"));
  if (checkbox.checked) {
  	showCollectionProperties(serviceId);
  }
  
}

function setCollectionProperties(serviceId) {

  	var collectionName = document.getElementById(serviceId + ".collectionName").value;
    var sqlType =  document.getElementById(serviceId + ".contentDataType").value;
    var assignmentMethod = document.getElementById(serviceId + ".keyAssignment").value;
    var collectionProperties = restAPI.createCollectionProperties(collectionName, sqlType, assignmentMethod);
    
	  if (assignmentMethod == "SEQUENCE") {
			var sequenceName =  document.getElementById(serviceId + ".sequenceName").value
    	collectionProperties.keyColumn.sequenceName = sequenceName;
    }
        
    return collectionProperties;

}

function showCollectionProperties(serviceId) {

    var target =  serviceId + ".collectionPropertiesViewer"
        
    var cpViewer = document.getElementById(target)
    cpViewer.innerHTML = "";
    jPP.printJson(cpViewer,null,setCollectionProperties(serviceId));
    
}

function updateCollectionProperties(serviceId) {

  if (document.getElementById(serviceId + ".showCollectionPropertiesDialog").checked ) {
  	showCollectionProperties(serviceId);
  }

}

function updateKeyAssignmentMethod(serviceId) {
	
	var assignmentMethod = document.getElementById(serviceId + ".keyAssignment").value;
  var sequenceDiv = document.getElementById(serviceId + ".divSequenceName");
	if (assignmentMethod == "SEQUENCE") {
		setVisibility(true,sequenceDiv);
		var sequenceName =  document.getElementById(serviceId + ".sequenceName");
		if ((typeof sequenceName.value == "undefined") || (sequenceName.value == "")) {
	  	var collectionName = document.getElementById(serviceId + ".collectionName");
			sequenceName.value = generateSequenceName(collectionName.value);
		}
	}
	else {
		setVisibility(false,sequenceDiv);
	}
  showCollectionProperties(serviceId);
}

function updateSequenceName(serviceId) {
	
  var sequenceName = document.getElementById(serviceId + ".sequenceName");
  if ((typeof sequenceName.value == "undefined") || (sequenceName.value.trim() == "")) {
  	var collectionName = document.getElementById(serviceId + ".collectionName");
  	sequenceName.value = generateSequenceName(collectionName.value);
 	}
  showCollectionProperties(serviceId);
}

function resetCreateCollection() {
	
	clearSQLResults(sqlGenerator.CREATE_COLLECTION);
  document.getElementById(sqlGenerator.CREATE_COLLECTION + ".collectionName").value = "";
  document.getElementById(sqlGenerator.CREATE_COLLECTION + ".keyAssignment").value = "UUID";
  document.getElementById(sqlGenerator.CREATE_COLLECTION + ".contentDataType").value = "BLOB";
  document.getElementById(sqlGenerator.CREATE_COLLECTION + ".showCollectionPropertiesDialog").checked = false;
  setVisibility(false,document.getElementById(sqlGenerator.CREATE_COLLECTION + ".collectionPropertiesDialog"));
  setVisibility(false,document.getElementById(sqlGenerator.CREATE_COLLECTION + ".divSequenceName"));
}

function doCreateCollection(serviceId) {
 
  var collectionName = document.getElementById(serviceId + ".collectionName")
 
  if ((typeof collectionName.value == "undefined") || (collectionName.value.trim() == "")) {
  	return false;
 	}
 	
  var collectionProperties = null;
 
  if (document.getElementById(serviceId + ".showCollectionPropertiesDialog").checked) {
    collectionProperties = setCollectionProperties(serviceId)
  }
   
  var callback = function(XHR,URL,collectionName) {
                   showResponse(sqlGenerator.CREATE_COLLECTION,XHR,URL,"createCollection","PUT");
                   if (XHR.status == 201) {
                     showSuccessMessage(
                       "Collection Created",
                       function () {
                       	 
                         doListCollections(collectionName);
                       }
                     )
                   }
                   else if (XHR.status == 200) {
                     showInformationMessage(
                       "Collection Exists. Status = " + XHR.status + " (" + XHR.statusText + ")",
                       function () {
                         setCollection(collectionName);
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
  resetCreateCollection();

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

function resetDropCollection() {
	
	clearSQLResults(sqlGenerator.DROP_COLLECTION);

}

function doDropCollection() {

  var collectionName = document.getElementById("dc.collectionName")
  var valid = validateCollectionName(collectionName);
  
  if (valid) {
  
    var callback = function(XHR,URL,collectionName) {
                     showResponse(sqlGenerator.DROP_COLLECTION,XHR,URL,"dropCollection","DELETE");
                     if (XHR.status == 200) {
                        showSuccessMessage(
                          'Collection Dropped',
                          function () { 
                            document.getElementById("dc.collectionName").value = "";
                            doListCollections();
                          }
                       )
                     }
                     else {
                        showErrorMessage(
                          "Drop Collection Failed. Status = " + XHR.status + " (" + XHR.statusText + ")",
                         function () {
                           document.getElementById("dc.collectionName").value = "";
                           doListCollections();
                         }
                       )
                     }
    }                           
    restAPI.dropCollection(callback);                         
    resetDropCollection();
  }
    

}

function addArgument(args,argName,argValue) {
  
  if (args !== "") {
    args = args + "&";
  }
  
  args = args + argName + "=" + argValue;
  
  return args;

}

function resetListKeys() {
	
	clearSQLResults(sqlGenerator.LIST_KEYS);


}

function doListKeys() {

  var args = "";

  var collectionName = document.getElementById(sqlGenerator.LIST_KEYS + ".collectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {

    var limit = document.getElementById(sqlGenerator.LIST_KEYS + ".limit");
    var offset = document.getElementById(sqlGenerator.LIST_KEYS + ".offset");

    if ((typeof limit.value == "undefined") || (limit.value == "") || (limit.value < 1)) {
    }
    else {
      args = addArgument(args,'limit',limit.value);
    }

    if ((typeof offset.value == "undefined") || (offset.value == "") || (offset.value < 1)) {
    }
    else {
      args = addArgument(args,'offset',offset.value);
    }

    args = addArgument(args,'fields',document.getElementById(sqlGenerator.LIST_KEYS + ".fieldList").value);
   
    var callback = function(XHR,URL) {
                     showResponse(sqlGenerator.LIST_KEYS,XHR,URL,"getCollection","GET");
                     if (XHR.status == 200) {
                       var jsonObject = null;
                       try {
		                     var optionList = document.getElementById(sqlGenerator.LIST_KEYS + ".documentList")
    		                 optionList.innerHTML = "";
                         jsonObject = JSON.parse(XHR.responseText);
                         if (jsonObject.items.length > 0) {
                           populateOptionList(optionList,jsonObject.items,"id");
                           optionList.options[0].selected = true;                     
                           setDocumentId(optionList.options[0].value);
                           var msg =  jsonObject.count + " documents found.";
                           if (jsonObject.hasMore) {
                           	 msg = msg + " More Available";
                           }
                           else {
                           	 msg = msg + " No More Available";
                           }
                           showSuccessMessage(msg);
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
    resetListKeys();
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
  
function isEmpty(serviceId) {

  var target = document.getElementById(serviceId);

  if ((typeof target.value == "undefined") || (target.value == "")) {
    return true;
  }
  return false;

}

function resetInsertDocument() {
	
	clearSQLResults(sqlGenerator.POST_DOCUMENT);
	document.getElementById(sqlGenerator.POST_DOCUMENT + '.Content').innerHTML = "";

}
  
function doInsertDocument() {

  var collectionName = document.getElementById(sqlGenerator.POST_DOCUMENT + ".collectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {

    if (isEmpty(sqlGenerator.POST_DOCUMENT + ".Cache")) {
      showErrorMessage("Load document content");
      return
    }      

    var callback = function(XHR,URL) {
                     showResponse(sqlGenerator.POST_DOCUMENT,XHR,URL,"postDocument","POST");
                     if (XHR.status == 201) {
                        showSuccessMessage(
                          'Document Created',
                          function () {
                          doListKeys();
                        }
                      )
                     }
                     else {
                        showErrorMessage("Create Document Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                     }
    } 
    restAPI.postDocument(null,JSON.parse(document.getElementById(sqlGenerator.POST_DOCUMENT + ".Cache").value),callback);                         
    resetInsertDocument();
  }
}

function resetUpdateDocument() {

	clearSQLResults(sqlGenerator.UPDATE_DOCUMENT);

}

function doUpdateDocument() {

  resetUpdateDocument();

  var collectionName = document.getElementById(sqlGenerator.UPDATE_DOCUMENT + ".collectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    var documentId = document.getElementById(sqlGenerator.UPDATE_DOCUMENT + ".DocumentId")
    valid = validateDocumentId(documentId);

    if (valid) {
      
      if (isEmpty(sqlGenerator.UPDATE_DOCUMENT + ".Cache")) {
        showErrorMessage("Load replacement content");
        return
      }      
    
      var callback = function(XHR,URL) {
                       showResponse(sqlGenerator.UPDATE_DOCUMENT,XHR,URL,"putDocument","PUT");
                       if (XHR.status == 200) {
                          showSuccessMessage(
                            'Document Updated'
                         )
                       }
                       else if (XHR.status == 201) {
                          showSuccessMessage(
                            'Document Created',
                            function () {
                             doListKeys();
                           }
                         )
                       }
                       else {
                          showErrorMessage("Update Document Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                       }
      } 
      restAPI.putDocument(documentId.value,JSON.parse(document.getElementById(sqlGenerator.UPDATE_DOCUMENT + ".Cache").value),callback);                         
    }
  }
  
}

function resetGetDocument() {

	clearSQLResults(sqlGenerator.GET_DOCUMENT);

}

function doGetDocument() {
	
  var collectionName = document.getElementById(sqlGenerator.GET_DOCUMENT + ".collectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    var documentId = document.getElementById(sqlGenerator.GET_DOCUMENT + ".DocumentId")
    valid = validateDocumentId(documentId);
    
    if (valid) {
      var callback = function(XHR,URL) {
                       showResponse(sqlGenerator.GET_DOCUMENT,XHR,URL,"getDocument","GET");
                       if (XHR.status == 200) {
                         renderResponse(XHR,'gd.Content')
                       }
                       else {
                          showErrorMessage("Unable to Fetch Document. Status = " + XHR.status + " (" + XHR.statusText + ")");
                       }
      } 
      restAPI.getDocument(documentId.value,callback);                         
     	resetGetDocument();
    }
  }

}

function resetDeleteDocument() {

	clearSQLResults(sqlGenerator.DELETE_DOCUMENT);

}

function doDeleteDocument() {
	
  var collectionName = document.getElementById(sqlGenerator.DELETE_DOCUMENT + ".collectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    var documentId = document.getElementById(sqlGenerator.DELETE_DOCUMENT + ".DocumentId")
    valid = validateDocumentId(documentId);

    if (valid) {
      var callback = function(XHR,URL) {
                       showResponse(sqlGenerator.DELETE_DOCUMENT,XHR,URL,"deleteDocument","DELETE");
                        if (XHR.status == 200) {
                          showSuccessMessage(
                            'Document Deleted',
                            function () { 
                             document.getElementById(sqlGenerator.DELETE_DOCUMENT + ".DocumentId").value = "";
                              doListKeys();
                            }
                         )
                       }
                       else {
                          showErrorMessage(
                            "Delete Failed. Status = " + XHR.status + " (" + XHR.statusText + ")",
                           function () {
                             document.getElementById(sqlGenerator.DELETE_DOCUMENT + ".DocumentId").value = "";
                             doListKeys();
                           }
                         )
                       }
      }    
      restAPI.deleteDocument(documentId.value,callback);                         
    	resetDeleteDocument();
    }
  }
}

function resetSearchCollection() {

	clearSQLResults(sqlGenerator.QUERY_BY_EXAMPLE);

}

function doSearchCollection() {

  var collectionName = document.getElementById(sqlGenerator.QUERY_BY_EXAMPLE + ".collectionName")
  var valid = validateCollectionName(collectionName);
  if (valid) {
    
    if (isEmpty(sqlGenerator.QUERY_BY_EXAMPLE + ".Cache")) {
      showErrorMessage("Load valid QBE document");
      return
    }      
        
    var callback = function(XHR,URL) {
                     showResponse(sqlGenerator.QUERY_BY_EXAMPLE,XHR,URL,"postDocument","POST");
                     // generateSQL(URL)
                     if (XHR.status == 200) {
                       var jsonObject = null;
                       try {
                          jsonObject = JSON.parse(XHR.responseText);
                       }
                       catch (e) {jsonObject = null};
                       var optionList = document.getElementById(sqlGenerator.QUERY_BY_EXAMPLE + ".documentList")
                       var optionList2 = document.getElementById(sqlGenerator.QUERY_BY_EXAMPLE + ".ReferenceList")
                       optionList.innerHTML = "";
                       if  (jsonObject != null) {
                         if (jsonObject.items.length > 0) {
                           populateOptionList(optionList,jsonObject.items,"id");
                           optionList.options[0].selected = true;
                           populateOptionList2(optionList2,jsonObject.items,"id",jsonObject.items,"value.Reference");
                           optionList2.options[0].selected = true;
                           var msg =  jsonObject.count + " documents found.";
                           if (jsonObject.hasMore) {
                           	 msg = msg + " More Available";
                           }
                           else {
                           	 msg = msg + " No More Available";
                           }
                           showSuccessMessage(msg);
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
    restAPI.postDocument('action=query&sqlStatement=true&keyPositions=true',JSON.parse(document.getElementById(sqlGenerator.QUERY_BY_EXAMPLE + ".Cache").value),callback);                  
    resetSearchCollection();
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

function resetBulkLoad() {

	clearSQLResults(sqlGenerator.BULK_INSERT);

}

function doBulkLoad() {
	
  var collectionName = document.getElementById(sqlGenerator.BULK_INSERT + ".collectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {
    
    if (isEmpty(sqlGenerator.BULK_INSERT + ".Cache")) {
      showErrorMessage("Load JSON Array");
      return
    }      

    var callback = function(XHR,URL) {
                     showResponse(sqlGenerator.BULK_INSERT,XHR,URL,"postDocument","POST");
                     if (XHR.status == 200) {
                        var count = JSON.parse(XHR.responseText).items.length
                        showSuccessMessage(
                          'Bulk Load Successful: ' + count + ' Documents loaded',
                          function () {
                          doListKeys();
                        }
                      )
                     }
                     else {
                        showErrorMessage("Bulk Load Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                     }
    } 
    restAPI.postDocument('action=insert',JSON.parse(document.getElementById(sqlGenerator.BULK_INSERT + ".Cache").value),callback);                         
	  resetBulkLoad();
  }
}

function SqlGenerator() {
	
  this.LIST_COLLECTIONS  = "lc";
	this.CREATE_COLLECTION = "cc";
  this.DROP_COLLECTION   = "dc";
  this.POST_DOCUMENT     = "pd";
  this.GET_DOCUMENT      = "gd";
  this.UPDATE_DOCUMENT   = "ud";
  this.DELETE_DOCUMENT   = "dd";
  this.LIST_KEYS         = "lk";
  this.LIST_DOCUMENTS    = "ld";
  this.QUERY_BY_EXAMPLE  = "qbe";
  this.BULK_INSERT       = "bi";

  var sqlOperations     = {
  	  "lc" : 
  	  function (URL,response) {
  	  	return "select OBJECT_NAME, JSON_DESCRIPTOR" + "\n" +
  	  	       "  from XDB.JSON$USER_COLLECTION_METADATA" + "\n" +
  	  	       " order by OBJECT_NAME" + "\n" +
  	  	       "/";
  	  },
  	  "cc" : 
  	  function (URL,response) {
  	    /* CREATE COLLECTION */
  	    var tableName = extractLastComponent(URL)
  	  	return "select \"OBJECT_NAME\", \"CREATED_ON\", \"CREATE_MODE\", \"JSON_DESCRIPTOR\"" + "\n" +
  	  	       "  from \"XDB\".\"JSON$COLLECTION_METADATA\"" + "\n" + 
  	  	       " where \"URI_NAME\" = '" + tableName + "'" + "\n" +
  	  	       "/";
  	  },
      "dc" : 
      function (URL,response) {
  	    /* DROP COLLECTION */
        var tableName = makeQuoted(extractLastComponent(URL))
  	  	return "describe " + tableName
  	  },        
  	  "pd" : 
  	  function (URL,response) {  
  	    /* POST DOCUMENT */
  	    var tableName    = makeQuoted(extractLastComponent(URL))
  	    var idColumnName = makeQuoted(getIDColumnName(tableName));
  	    var id           = JSON.parse(response).items[0].id;
        return "select * " + "\n" + 
               "  from " + tableName + "\n" +
               " where " + idColumnName + " = '" + id + "'" + "\n" +
  	  	       "/";
      },
  	  "gd" : 
  	  function (URL,response) {
  	    /* GET DOCUMENT */
  	    var tableName    = makeQuoted(extractPenultimateComponent(URL))
  	    var idColumnName = makeQuoted(getIDColumnName(tableName));
  	    var id           = extractLastComponent(URL);
        return "select * " + "\n" + 
               "  from " + tableName + "\n" +
               " where " + idColumnName + " = '" + id + "'" + "\n" +
  	  	       "/";
      },
  	  "ud" : 
  	  function (URL,response) {
  	    /* UPDATE DOCUMENT */
  	    var tableName    = makeQuoted(extractPenultimateComponent(URL))
  	    var idColumnName = makeQuoted(getIDColumnName(tableName));
  	    var id           = extractLastComponent(URL);
        return "select * " + "\n" + 
               "  from " + tableName + "\n" +
               " where " + idColumnName + " = '" + id + "'" + "\n" +
  	  	       "/";
      },
  	  "dd" : 
  	  function (URL,response) {
  	    /* DELETE DOCUMENT */
  	    var tableName    = makeQuoted(extractPenultimateComponent(URL))
  	    var idColumnName = makeQuoted(getIDColumnName(tableName));
  	    var id           = extractLastComponent(URL);
        return "select count(*) " + "\n" + 
               "  from " + tableName + "\n" +
               " where " + idColumnName + " = '" + id + "'" + "\n" +
  	  	       "/";
      },
  	  "ld" : 
  	  function (URL,response) {
  	    /* LIST DOCUMENTS */
  	    var tableName    = makeQuoted(extractLastComponent(URL))
  	    var idColumnName = makeQuoted(getIDColumnName(tableName));

  	    var jsonResponse = JSON.parse(response);
  	    var offset = jsonResponse.offset;
  	    var limit  = jsonResponse.limit;
  	    var sql = "select " + idColumnName + "\n" + 
                  "  from " + tableName + "\n";
        if (offset > 0) {
  	  		sql = sql + "offset " + offset + "rows" + "\n";
        }
  	  	if (limit > 0) {
  	  		sql = sql + "fetch first " + limit + " rows only" + "\n";
  	  	}
  	  	return sql + "/";
      },
  	  "lk" : 
  	  function (URL,response) {
  	    /* LIST KEYS */
  	  	var selectList = "*";

  	  	var query = URL.substr(URL.indexOf("?")+1);
  	  	if (query != null) {
  	  		var fields = query.substring(query.indexOf("fields=") + 7);
  	  		if (fields != null) {
  	  			if (fields.indexOf("&") > 0) {
  	  				fields = fields.substring(0,fields.indexOf("&"));
  	  			}
  	  			if (fields == "id") {
  	  				selectList = makeQuoted(getIDColumnName(tableName));
  	  			}
  	  			if (fields == "value") {
  	  				selectList = makeQuoted(getJSONColumnName(tableName));
  	  		  }
  	  		}
  	    }
  	    	
  	    var tableName    = makeQuoted(extractLastComponent(URL))
  	    var idColumnName = makeQuoted(getIDColumnName(tableName));
  	    var jsonResponse = JSON.parse(response);
  	    var offset = jsonResponse.offset;
  	    var limit  = jsonResponse.limit;
  	    var sql = "select " + selectList + "\n" + 
                  "  from " + tableName + "\n";
        if (offset > 0) {
  	  		sql = sql + "offset " + offset + " rows" + "\n";
        }
  	  	if (limit > 0) {
  	  		sql = sql + "fetch first " + limit + " rows only" + "\n";
  	  	}
  	  	return sql + "/";
      },
  	  "qbe" : 
  	  function (URL,response) {
  	    /* QBE */
        return "";
      },
  	  "bi" : 
  	  function (URL,response) {
  	    /* BULK INSERT */
  	    var tableName    = makeQuoted(extractLastComponent(URL))
  	    var idColumnName = makeQuoted(getIDColumnName(tableName));

  	    var creationDate = JSON.parse(response).items[0].created;
        return "select count(*) " + "\n" + 
               "  from " + tableName + "\n" +
               " where DATE_CREATED = to_timestamp('" + creationDate + "','YYYY-MM-DD\"T\"HH24:MI:SS.FF')" + "\n" + 
  	  	       "/";
      }
 	}

  function makeQuoted(identifier) {
  	
  	return "\"" + identifier + "\"";
 	}
 	
 	function getIDColumnName(tableName) {
 		// TODO : Look up from Collection Properties
 	  return "ID"
 	}
 	
 	function getJSONColumnName(tableName) {
 		// TODO : Look up from Collection Properties
 	  return "JSON_DOCUMENT"
 	}

 	function extractLastComponent(URL) {
 	  
 	  var offset = URL.indexOf('?')
 	  
 	  if (offset > 0) {
 	    URL = URL.substring(0,offset);
 	  }

 	  if (URL.lastIndexOf('/') === URL.length) {
 	    URL = URL.substring(0,URL.length-1);
 	  }

    return URL.substring(URL.lastIndexOf('/')+1);
    
  }  
  
 	function extractPenultimateComponent(URL) {
 	  
 	  var offset = URL.indexOf('?')
 	  
 	  if (offset > 0) {
 	    URL = URL.substring(0,offset-1);
 	  }

 	  if (URL.lastIndexOf('/') === URL.length) {
 	    URL = URL.substring(0,URL.length-1);
 	  }

    return extractLastComponent(URL.substring(0,URL.lastIndexOf('/')))
    
  }  
    
  this.getSQLStatement = function (serviceId,XHR,URL) {
    
    var sqlGenerator = sqlOperations[serviceId];
    return sqlGenerator(URL,XHR.responseText);
    
  }

  this.runSQL = function(sqlId) {
	
  	var sqlText = document.getElementById(sqlId + ".SQL").textContent
  	var sqlScript = new SqlScript(sqlId);
	  sqlScript.setCommands(sqlText);
    sqlScript.setUsername(document.getElementById("sqlUsername").value);
	  sqlProcessor.runSQLCommand(sqlScript);
	
  }
}

function doExecuteSQL(sqlId) {
	sqlGenerator.runSQL(sqlId);
}

function RestSQLPlayer() {
	
  this.getResultsPanel = function(statementId) {
  	var outputTargetName = statementId + ".result"
    return outputTarget = document.getElementById(outputTargetName);
  }
  
  this.resetResultsPanel	= function() {
  }

  this.displayTiming	= function() {
  }

  this.toggleTiming	= function() {
  }
  
  this.loadNextCommand = function () {
  }
  
  this.setExecutableState = function() {
  }
  
  this.enableExecuteButton = function() {
	}

}

function setTabFocus() {

  /*
  	$(document).on( 'shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
      var activatedTab = e.target; // activated tab
      alert(activatedTab.hash.substring(1))
    })
	$('#CreateCollection').on("show.bs.tab", function(event) { alert('Create Collection'); $("#cc.collectionName").focus();});
	// $('#cc_dataTab').on("shown.bs.tab", function(event) { alert('Create Collection'); $("#cc.collectionName").focus();});
  */
}

function init() {

  try {
  	restAPI.addLogWindow();
		initXFilesCommon();
  	demoPlayer = new RestSQLPlayer()
  	// setTabFocus();
    if (isORDS) {
		  restAPI.setORDS();
		  restAPI.setSchema("scott");
		  // Remove Password Field from form
		  var pwd = document.getElementById("sqlPassword");
		  pwd.parentNode.removeChild(pwd);
		  // Remove SQL Tabs from form.
			for (var i =0; i<serviceList.length; i++) {
				var tab = document.getElementById(serviceList[i] + "_sqlTabLi");
				tab.parentNode.removeChild(tab);
    	}
    }
    else {
    	restAPI.setServletRoot('/DBJSON');
    }
  }
  catch (e) {
    handleException('JSONREST.init',e,null);
  }
}

