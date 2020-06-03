
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

$(function(){
      $('#collectionTab').on('shown.bs.tab', function (e) {
      // Get the name of active tab
      var activeTab = $(e.target).text(); 
      if (activeTab == "Create PurchaseOrder") {
      	var poForm = document.getElementById("PurchaseOrderForm");
      	var parentNode = poForm.parentNode;
      	parentNode.removeChild(poForm);
      	var poTab = document.getElementById("cpo_dataTab");
      	poTab.appendChild(poForm);
      	newPurchaseOrder();
      }
      if (activeTab == "Search PurchaseOrders") {
      	var poForm = document.getElementById("PurchaseOrderForm");
      	var parentNode = poForm.parentNode;
      	parentNode.removeChild(poForm);
      	var poTab = document.getElementById("sd_dataTab");
      	poTab.appendChild(poForm);
      	qbeInitialize();
      }
   });
})

var tabPrefixList = ["cc", "cpo", "dc", "ld", "id", "pd", "gd", "dd", "sd", "bl"];

function showSQLPageDialog(URL) {
	BootstrapDialog.show({
            message: function(dialog) {
                var $message = $('<div></div>');
                var pageToLoad = dialog.getData('pageToLoad');
                $message.load(pageToLoad);
                return $message;
            },
            data: {
                'pageToLoad': '/XFILES/WebDemo/runtime.html?target=' + URL + '&amp;stylesheet=/XFILES/Applications/REST/executeSQL.xsl&amp;includeContent=true'
        		}}
        	);
}

function showSQLPage1(URL) {
  window.open('/XFILES/WebDemo/runtime.html?target=' + URL + '&amp;stylesheet=/XFILES/Applications/REST/executeSQL.xsl&amp;includeContent=true','sqlWindow','width=1200,height=500,resizable=no,scrollbars=yes,toolbar=no,location=no,directories=no,status=no,menubar=no,copyhistory=no')
}

function runSQL(sqlText,sqlId) {
	
	var sqlScript = new SqlScript(sqlId);
	sqlScript.setCommands(sqlText);
  sqlScript.setUsername(document.getElementById("sqlUsername").value);
	sqlProcessor.runSQLCommand(sqlScript);
	
}

function loadSQLExample(URL,target,collectionName) {

  var XHR = new XMLHttpRequest();
  XHR.open ("GET", URL, true);
  XHR.onreadystatechange = function() { 
                             if (XHR.readyState==4) {
                             	 if (XHR.status == 200) {
                             	   document.getElementById(target).textContent = XHR.responseText.replace('%TABLE_NAME%',collectionName);
                             	 }
                             	 else {
                             	 	 showInformationMessage("Unable to load \"" + URL + "\". Http Status : " + XHR.status + " (" + XHR.statusText + ")");
                            	 }
                             }
                            } 
    XHR.send(null);
}

function loadSQLExamples(collectionName) {
		
	loadSQLExample('sql/sqlExample1.sql','sql1.SQL',collectionName);
	loadSQLExample('sql/sqlExample2.sql','sql2.SQL',collectionName);
	loadSQLExample('sql/sqlExample3.sql','sql3.SQL',collectionName);
	loadSQLExample('sql/sqlExample4.sql','sql4.SQL',collectionName);
	loadSQLExample('sql/sqlExample5.sql','sql5.SQL',collectionName);
	loadSQLExample('sql/sqlExample6.sql','sql6.SQL',collectionName);
	loadSQLExample('sql/sqlExample7.sql','sql7.SQL',collectionName);
	
}

function setCollectionProperties() {

  var tableName = document.getElementById("cc.CollectionName").value
  var sqlType = "CLOB";
  var assignmentMethod = "UUID";
  return restAPI.createCollectionProperties(tableName,sqlType,assignmentMethod);

}

function setCollectionName(collectionName) {
	
	setCollection(collectionName);
	document.getElementById("cc.SQL").textContent = 'describe "' + collectionName + '"';
	loadSQLExamples(collectionName);
	
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
   
  collectionProperties = setCollectionProperties()
   
  var callback = function(XHR,URL,collectionName) {
                   document.getElementById("cc.CollectionName").value = "";
                   showResponse('cc',XHR,URL,"createCollection","PUT");
                   if (XHR.status == 201) {
                      showSuccessMessage(
                        'Collection Created',
                        function () {
                         setCollectionName(collectionName);
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


function getSQLFolderPath() {
	
	return '/home/' + document.getElementById('sqlUsername').value;
	
}

function executeSQL(sql) {
	
	var targetFolder = getSQLFolderPath();
	var URL = targetFolder + "/sqlScript.sql";
	
  var XHR = new XMLHttpRequest();
  XHR.open ("PUT", URL, true);
  XHR.setRequestHeader("Content-type","text/plain");
  XHR.onreadystatechange = function() { 
                             if (XHR.readyState==4) { 
                               if ((XHR.status == 200) || (XHR.status == 201) || (XHR.status == 204)) {
                               	 showSQLPage(URL);
                               }
                               else {
					                      showErrorMessage("Creation of SQL Script [" + URL + "] failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                               }	 
                             } 
											     }
  XHR.send(sql);

}

function doExecuteSQL(sqlId) {
	
	var sqlText = document.getElementById(sqlId + ".SQL").textContent
	// executeSQL(sqlText);
	runSQL(sqlText,sqlId,document.getElementById("cc.CollectionName").value);
}

function newPurchaseOrder() {
	
  document.getElementById("btn.saveNewDocument").style.display = "block";
  document.getElementById("btn.cancelOperation").style.display = "block";

	document.getElementById("btn.qbeInitialize").style.display = "none";
  document.getElementById("btn.qbeRunQuery").style.display = "none";
	document.getElementById("btn.newDocument").style.display = "none";
  document.getElementById("btn.editDocument").style.display = "none";
  document.getElementById("btn.saveDocument").style.display = "none";
  document.getElementById("btn.deleteDocument").style.display = "none";

  resetFormObject(TEMPLATE_DOCUMENT,null);
  getDocument("js/poTemplate.json",loadNewDocument)

}

function extractPenultimateComponent(URL) {
	
	var offset = URL.indexOf("?");
	if (offset > -1) { 
		URL = URL.substring(0,offset);
  }
  offset = URL.lastIndexOf("/");
  URL = URL.substring(0,offset);
  offset = URL.lastIndexOf("/");
  return URL.substring(offset+1);
}
	
function extractLastComponent(URL) {
	
	var offset = URL.indexOf("?");
	if (offset > -1) { 
		URL = URL.substring(0,offset);
  }
  offset = URL.lastIndexOf("/");
  return URL.substring(offset+1);
}
	

function processInsert(XHR,URL) {
 if (XHR.status == 201) {
		showResponse('cpo',XHR,URL,"putDocument","PUT");
		var responseObject = JSON.parse(XHR.responseText);
  	document.getElementById("cpo.SQL").textContent = 'select * from "' + extractLastComponent(URL) + '" where ID = \'' + responseObject.items[0].id + '\'\n/';
    document.getElementById("btn.listPurchaseOrders").style.display = "block";
  	document.getElementById("btn.qbeInitialize").style.display = "block";
	  document.getElementById("btn.newDocument").style.display="block";
	  document.getElementById("btn.editDocument").style.display="block";
  	document.getElementById("btn.deleteDocument").style.display="block";
  	document.getElementById("btn.saveNewDocument").style.display="none";
    document.getElementById("btn.cancelOperation").style.display = "none";
    showSuccessMessage(
      'Document Created'
    )
  }
  else {
    showErrorMessage("Save Document Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
  }
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
         'Connected'
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
                  	 var responseObject = JSON.parse(XHR.responseText);
                     if (XHR.status == 200) {
	   								    document.getElementById("bl.SQL").textContent = 'select ID from "' + extractLastComponent(URL) + '" where DATE_CREATED >= to_timestamp(\'' + responseObject.items[0].created + '\',\'YYYY-MM-DD"T"HH24:MI:SS.FF\')\n/';
                        var count = JSON.parse(XHR.responseText).items.length
                        showSuccessMessage(
                          'Bulk Load Successful: ' + count + ' Documents loaded'
                      	)
                     }
                     else {
                        showErrorMessage("Bulk Load Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
                     }
    } 
    restAPI.postDocument('action=insert',JSON.parse(document.getElementById('bl.Cache').value),callback);                         
  }
}

function extendListBox(XHR,URL) {
	
  var SELECT = document.getElementById("ld.documentList");
  showResponse('ld',XHR,URL,"getCollection","GET");
  jsonObject = JSON.parse(XHR.responseText);
  document.getElementById("ld.SQL").textContent = 'select ID, JSON_VALUE(JSON_DOCUMENT,\'$.Reference\') from "' + extractLastComponent(URL) + '" j \n/';
  populateListBox(SELECT,restAPI.processGetResponse(XHR,URL));
  	
}

function doListDocuments() {

  var args = "";

  var collectionName = document.getElementById("ld.CollectionName")
  var valid = validateCollectionName(collectionName);

  if (valid) {

    args = 'limit=20&fields=all'
   
    var callback = function(XHR,URL) {
                     showResponse('ld',XHR,URL,"getCollection","GET");
                     if (XHR.status == 200) {
                       var jsonObject = null;
                       try {
                          jsonObject = JSON.parse(XHR.responseText);
                       }
                       catch (e) {jsonObject = null};
										   var SELECT = document.getElementById("ld.documentList");
  										 SELECT.innerHTML = "";
  										 SELECT.dataset.loadMore = "";
                       if  (jsonObject != null) {
                         if (jsonObject.items.length > 0) {
			                  	 document.getElementById("ld.SQL").textContent = 'select ID, JSON_VALUE(JSON_DOCUMENT,\'$.Reference\') from "' + extractLastComponent(URL) + '" j \n/';
													 populateListBox(SELECT,restAPI.processGetResponse(XHR,URL));
                           SELECT.options[0].selected = true;
                           setDocumentId(SELECT.options[0].value);
                           showSuccessMessage(jsonObject.items.length + " documents found.");
                          }
                         else {
                           showErrorMessage("Empty Collection");
                         }
                       }
                       else {
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
 			                  	document.getElementById("gd.SQL").textContent = 'select JSON_DOCUMENT from "' + extractPenultimateComponent(URL) + '" j where ID = \'' + extractLastComponent(URL) + '\'\n/';
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


function qbeProcessResult(XHR,URL) {
	
  var qbeResults = restAPI.processQueryResult(XHR,URL)
  showResponse('sd',XHR,URL,"postDocument","POST");
  if (qbeResults != null) {
  	resetPurchaseOrderForm();
  	renderReferenceList(qbeResults);
  }
}	

function qbeExecuteQuery(object,callback) {
 
  var qbe = qbeMakeQueryFromObject(object);
	document.getElementById('sd.Cache').value = JSON.stringify(qbe);
  restAPI.postDocument('action=query&sqlStatement=true&keyPositions=true',qbe,callback);                    

}

function init() {
	restAPI.addLogWindow();
	initXFilesCommon();
	getDocument("js/poTemplate.json",saveTemplate)
	demoPlayer = new RestSQLPlayer()
	if (isORDS) {
		restAPI.setORDS();
		restAPI.setSchema("scott");
	  // Remove Password field from form.
    var pwd = document.getElementById("sqlPassword");
	  pwd.parentNode.removeChild(pwd);
	  // Remove SQL Tabs from form.
		for (var i =0; i<tabPrefixList.length; i++) {
			var tab = document.getElementById(tabPrefixList[i] & "_sqlTabLi");
			tab.parentNode.removeChild(tab);
    }
 	}
  else {
  	restAPI.setServletRoot("/DBJSON");
  }
}