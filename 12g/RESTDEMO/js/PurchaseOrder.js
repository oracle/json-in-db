
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


var CURRENT_DOCUMENT
var TEMPLATE_DOCUMENT
 	
function saveTemplate(XHR,URL) {

	TEMPLATE_DOCUMENT = processDocument(XHR,URL);
  resetPurchaseOrderForm();
	
}

function loadNewDocument(XHR,URL) {

  CURRENT_DOCUMENT = processDocument(XHR,URL);
  makeEditable(CURRENT_DOCUMENT,null,false);

}

function init() {

  initCommon();
  initRestLogin();  
  restAPI.setCollectionName("MyCollection");
  getDocument("js/poTemplate.json",saveTemplate)

}  

function resetPurchaseOrderForm() {

	document.getElementById("btn.listPurchaseOrders").style.display = "block";
	document.getElementById("btn.qbeInitialize").style.display = "block";
	document.getElementById("btn.newDocument").style.display = "block";

	document.getElementById("ReferenceList").style.display = "none";;
  document.getElementById("btn.qbeRunQuery").style.display = "none";
  document.getElementById("btn.saveNewDocument").style.display = "none";
  document.getElementById("btn.editDocument").style.display = "none";
  document.getElementById("btn.saveDocument").style.display = "none";
  document.getElementById("btn.deleteDocument").style.display = "none";
  document.getElementById("btn.cancelOperation").style.display = "none";
	
  resetFormObject(TEMPLATE_DOCUMENT,null);
  makeDisplayOnly(TEMPLATE_DOCUMENT,null,false);

}

function displayPurchaseOrder(po) {
	
 	document.getElementById("btn.listPurchaseOrders").style.display = "block";
  document.getElementById("btn.qbeInitialize").style.display = "block";
  document.getElementById("btn.qbeRunQuery").style.display = "none";
  document.getElementById("btn.editDocument").style.display = "block";
  document.getElementById("btn.saveDocument").style.display = "none";
  document.getElementById("btn.deleteDocument").style.display = "block";
  renderJSONObject(po)
	
}

function editPurchaseOrder() {

  document.getElementById("btn.saveDocument").style.display="block";
  document.getElementById("btn.cancelOperation").style.display = "block";
 
 	document.getElementById("btn.listPurchaseOrders").style.display = "none";
  document.getElementById("btn.qbeInitialize").style.display = "none";
  document.getElementById("btn.qbeRunQuery").style.display = "none";
  document.getElementById("btn.editDocument").style.display="none";
  document.getElementById("btn.newDocument").style.display = "none";
  document.getElementById("btn.saveNewDocument").style.display = "none";
  document.getElementById("btn.deleteDocument").style.display = "none";

  makeEditable(CURRENT_DOCUMENT,null);
 
}

function processUpdate(XHR,URL) {

  if (XHR.status == 200) {
  	document.getElementById("btn.listPurchaseOrders").style.display = "block";
  	document.getElementById("btn.qbeInitialize").style.display = "block";
	  document.getElementById("btn.newDocument").style.display="block";
	  document.getElementById("btn.editDocument").style.display="block";
  	document.getElementById("btn.deleteDocument").style.display="block";
  	document.getElementById("btn.saveDocument").style.display="none";
    document.getElementById("btn.cancelOperation").style.display = "none";
    showSuccessMessage(
      'Document Updated'
    )
  }
  else {
    showErrorMessage("Update Document Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
  }
}

function processGetPurchaseOrder(XHR,URL) {
	
	var po = restAPI.processGetResponse(XHR,URL);
	if (po != null) {
		CURRENT_DOCUMENT = po;
		displayPurchaseOrder(CURRENT_DOCUMENT);
  }
}

function doListPurchaseOrder(SELECTOR) {
	
	restAPI.getDocument(SELECTOR.value,processGetPurchaseOrder);
	$('#listPurchaseOrders').modal('hide')
	
}

function savePurchaseOrder(docid) {
 
   makeDisplayOnly(CURRENT_DOCUMENT,null,true);
   restAPI.putDocument(docid,CURRENT_DOCUMENT,processUpdate);                         
  
}

function processInsert(XHR,URL) {
 if (XHR.status == 201) {
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

function saveNewPurchaseOrder() {
 
  makeDisplayOnly(CURRENT_DOCUMENT,null,true);
  restAPI.postDocument(null,CURRENT_DOCUMENT,processInsert);                         
  
}

function newPurchaseOrder() {
	
  document.getElementById("btn.saveNewDocument").style.display = "block";
  document.getElementById("btn.cancelOperation").style.display = "block";

	document.getElementById("ReferenceList").style.display = "none";;
	document.getElementById("btn.listPurchaseOrders").style.display = "none";
	document.getElementById("btn.qbeInitialize").style.display = "none";
  document.getElementById("btn.qbeRunQuery").style.display = "none";
	document.getElementById("btn.newDocument").style.display = "none";
  document.getElementById("btn.editDocument").style.display = "none";
  document.getElementById("btn.saveDocument").style.display = "none";
  document.getElementById("btn.deleteDocument").style.display = "none";

  resetFormObject(TEMPLATE_DOCUMENT,null);
  getDocument("js/poTemplate.json",loadNewDocument)

}
	
function removeCurrentReference() {
	
   var selector = document.getElementById("ReferenceList");
	 var selectedIndex = selector.selectedIndex
	 var removeLast = (selectedIndex + 1 == selector.options.length);
	 selector.remove(selectedIndex);
	 if (removeLast) {
	 	 if (selector.options.length == 0) {
	 	 	 resetPurchaseOrderForm();
  	 }
	 	 else {
	 	   selector.selectedIndex = selector.options.length-1;
	 	   showDocumentById(selector.value);
	 	 }
	 }
	 else {
	 	 selector.selectedIndex = selectedIndex;
	   showDocumentById(selector.value);
	 }
   showSuccessMessage("Document Deleted");
}

function processDelete(XHR,URL) {
	
  if (XHR.status == 200) {
    removeCurrentReference()
  }
  else {
    showErrorMessage(
      "Delete Failed. Status = " + XHR.status + " (" + XHR.statusText + ")"
    )
  }
}

function deletePurchaseOrder(docid) {
 
  restAPI.deleteDocument(docid,processDelete);                         
  
}

function showDocumentById(docid) {
	
  var callback = function(XHR,URL) {
                   if (XHR.status == 200) {
                     CURRENT_DOCUMENT = JSON.parse(XHR.responseText);
				  		    	 displayPurchaseOrder(CURRENT_DOCUMENT)                     
                   }
                   else {
                     showErrorMessage("Unable to Fetch Document. Status = " + XHR.status + " (" + XHR.statusText + ")");
                   }
                 } 
  restAPI.getDocument(docid,callback);                         
}

function getPurchaseOrder(PONumber) {
	
  var callback = function(XHR,URL) {
	                if (XHR.status == 200) {
  						  	  var jsonObject = null;
	  						    try {
		  					    	jsonObject = JSON.parse(XHR.responseText);
		  					    	
			  				    }
  				  			  catch (e) {jsonObject = null};
  				  		    if  (jsonObject != null) {
  				  		    	 if (jsonObject.items.length > 0) {
  				  		    	 	 CURRENT_DOCUMENT = jsonObject.items[0].value
    				  		    	 displayPurchaseOrder(CURRENT_DOCUMENT)
  				  		    	 }
  	                   else {
 			   					      showErrorMessage("Cannot find PurchaseOrder with PONumber " + PONumber);
                       }
  				  		    }
                    else {
 								      showErrorMessage("Error searching for PurchaseOrder with PONumber " + PONumber);
                    }
                  }
 	                else {
    	             showErrorMessage("Query By Example Failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
  	              }
  	            }

	var searchCriteria = new Object();
	searchCriteria.PONumber = PONumber;

  restAPI.postDocument('action=query',searchCriteria,callback);                  
}

function loadPurchaseOrder(PONumber) {
 	
  getPurchaseOrder(PONumber);

}

function renderReferenceList(results) {

  var SELECT = document.getElementById("ReferenceList");
  SELECT.style.display = "block"; 
  SELECT.innerHTML = "";
  populateOptionList2(SELECT,results.items,"id",results.items,"value.Reference");
  SELECT.options[0].selected = true;
  
  showDocumentById(SELECT.value)

}

function qbeProcessResult(XHR,URL) {
	
  var qbeResults = restAPI.processQueryResult(XHR,URL)
  if (qbeResults != null) {
  	resetPurchaseOrderForm();
  	renderReferenceList(qbeResults);
  }
}	

function qbeRunQuery() {
	
  qbeExecuteQuery(TEMPLATE_DOCUMENT,qbeProcessResult)

}

function qbeInitialize() {

  document.getElementById("btn.cancelOperation").style.display = "block";
  document.getElementById("btn.qbeRunQuery").style.display = "block";
 
 	document.getElementById("btn.listPurchaseOrders").style.display = "none";
  document.getElementById("btn.qbeInitialize").style.display = "none";
  document.getElementById("btn.editDocument").style.display = "none";
  document.getElementById("btn.saveDocument").style.display = "none";
  document.getElementById("btn.newDocument").style.display = "none";
  document.getElementById("btn.saveNewDocument").style.display = "none";
  document.getElementById("btn.deleteDocument").style.display = "none";

  var selector = document.getElementById("ReferenceList")
  selector.innerHTML = "";
  selector.style.display = "none";

  resetFormObject(TEMPLATE_DOCUMENT,null);
  makeEditable(TEMPLATE_DOCUMENT,null); 
	
}

function populateListBox(SELECT,dataset) {

  if (dataset != null) {
	  populateOptionList2(SELECT,dataset.items,"id",dataset.items,"value.Reference");
  	if (dataset.hasMore) {
  		for (var i=0; i < dataset.links.length; i++) {
  			if (dataset.links[i].rel == "next") {
	  			SELECT.dataset.loadMore = dataset.links[i].href.substr(dataset.links[i].href.indexOf("?") + 1);
	  			break
  			}
  		}
  	}
  	else {
  		SELECT.dataset.loadMore = "";
  	}
  }
}

function extendListBox(XHR,URL) {
	
  var SELECT = document.getElementById("poList");
  populateListBox(SELECT,restAPI.processGetResponse(XHR,URL));
  	
}

function initializeListBox(XHR,URL) {
	
  var SELECT = document.getElementById("poList");
  SELECT.innerHTML = "";
  SELECT.dataset.loadMore = "";
  populateListBox(SELECT,restAPI.processGetResponse(XHR,URL));
	$('#listPurchaseOrders').modal('show')
  	
}

function loadMoreDocuments(documentList) {

  if (documentList.scrollTop + documentList.clientHeight >= documentList.scrollHeight) {
		if (documentList.dataset.loadMore != "") {
    	restAPI.getCollection(documentList.dataset.loadMore,extendListBox);	
    }
 	}
}

function loadDocumentList() {

  restAPI.getCollection('limit=20&fields=all',initializeListBox);	
	
}