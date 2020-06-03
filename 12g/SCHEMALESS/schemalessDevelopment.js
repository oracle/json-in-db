
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

var serverAssignedKeys = true;

function rowToJson(target) {

	var jsonObject = new Object();
	// Find the 'table' element
	  
	var inputCollection = target.getElementsByTagName("INPUT");
	for (var i = 0; i < inputCollection.length; i++) {
	  var inputItem = inputCollection[i];
    jsonObject[inputItem.name]  = inputItem.value;
	}
	return jsonObject
}

function createIcon(src,alt) {
     var IMG = document.createElement("IMG");
     IMG.src = src
     IMG.alt = alt
     IMG.border = 0;
     IMG.align = "absmiddle"
     IMG.width = 16;
     IMG.heigh = 16;
     return IMG
}

function createButton(src,title) {
	
  /*
	  <button id="btn.saveNewDocument" type="button" class="btn btn-default btn-med" onclick="doCreateCollection();return false;">
		  <img src="/XFILES/lib/icons/json_create_collection.png" alt="New Collection" border="0" align="absmiddle" width="16" height="16"/>
	  </button>
  */

  var BUTTON = document.createElement("button");
  BUTTON.className="btn btn-default btn-med"
  BUTTON.type="button"
  BUTTON.appendChild(createIcon(src,title));
  return BUTTON
  
}

function createSpacer() {
  SPAN = document.createElement("SPAN")
  SPAN.style.width = "10px";
  SPAN.style.display="inline-block";
  return SPAN;
}

function createTable() {
  
  var table = document.createElement("SPAN");
  table.style.display = "table";
  return table;
}  

function createTableHeader() {
  
  var header = document.createElement("SPAN");
  header.style.display = "table-row"
  return header;
}  
  
function createTableRow() {
  
  var row = document.createElement("SPAN");
  row.style.display = "table-row"
  return row

}  

function createCell() {
  var cell = document.createElement("SPAN");
  cell.style.display = "table-cell";
  cell.style.paddingRight = "10px";
  return cell;
}

function createHeadingCell(name) {

   var newHeadingCell = createCell();
   newHeadingCell.appendChild(document.createTextNode(name));
   return newHeadingCell;

}

function addFieldMenu(INPUT) {

/*
    <div class="input-group">
      <input type="text" class="form-control">
      <div class="input-group-btn">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Action <span class="caret"></span></button>
        <ul class="dropdown-menu dropdown-menu-left" role="menu">
          <li><a href="#">Action</a></li>
          <li><a href="#">Another action</a></li>
          <li><a href="#">Something else here</a></li>
          <li class="divider"></li>
          <li><a href="x#">Separated link</a></li>
        </ul>
      </div><!-- /btn-group -->
    </div><!-- /input-group -->
*/

   var DIV1 = document.createElement("DIV");
   DIV1.className = "input-group";
   var DIV2 = document.createElement("DIV");
   DIV2.className = "input-group-btn"
   DIV1.appendChild(DIV2);
   var BUTTON = document.createElement("BUTTON");
   DIV2.appendChild(BUTTON);
   BUTTON.type="button";
   BUTTON.className = "btn btn-default dropdown-toggle";
   BUTTON.dataset.toggle="dropdown"
   var SPAN = document.createElement("SPAN");
   BUTTON.appendChild(SPAN);
   SPAN.className="caret";
   var UL = document.createElement("UL");
   DIV2.appendChild(UL);
   UL.className = "dropdown-menu"
   UL.role="menu"
   var LI = document.createElement("LI");
   UL.appendChild(LI);
   var A=document.createElement("A");
   LI.appendChild(A);
   A.textContent="Add Field";
	 A.onclick = function(target) { return function() { doInsertField(target); return false }; }(INPUT);
   A.href="#"
   var LI = document.createElement("LI");
   UL.appendChild(LI);
   var A=document.createElement("A");
   LI.appendChild(A);
   A.textContent="Remove Field";
   A.onclick = function(target) { return function() { removeField(target); return false }; }(INPUT);
   A.href="#"
   DIV1.appendChild(INPUT);

   return DIV1;
}

function createInputCell(name) {

   var INPUT = document.createElement("INPUT")
   INPUT.type = "text"
   INPUT.className = "form-control"
   INPUT.placeholder = name;
   INPUT.name = name;
      
   var newContentCell = createCell();
   newContentCell.appendChild(addFieldMenu(INPUT));
   return newContentCell

}

function getCollectionName() {
  var collectionList = document.getElementById("collectionList");
	var collectionName = collectionList.value;
	return collectionName;
}

function appendField(name) {

   closeModalDialog("newFieldDialog")
  
   var table = document.getElementById("editDocument").firstChild;
   var contentRow = table.lastChild;
   var headingRow = contentRow.previousSibling;
   
   if (contentRow.childNodes.length > 3) {
 	 	 contentRow.parentNode.appendChild(createTableHeader());
 	 	 contentRow.parentNode.appendChild(createTableRow());
     var newHeadingRow = contentRow.nextSibling;
     var newContentRow = newHeadingRow.nextSibling;
   	 headingRow = newHeadingRow;
   	 contentRow = newContentRow;
   }

   headingRow.appendChild(createHeadingCell(name));
   var contentCell = createInputCell(name);
   contentRow.appendChild(contentCell);
   contentCell.firstChild.focus();
  
}

function getFieldLocator(target) {

  var fl = new Object();

   // Find the table-cell and table-row (SPAN) containing the target element (SPAN-DIV->INPUT)

   fl.contentCell  = target.parentNode.parentNode; 
   fl.contentRow   = fl.contentCell.parentNode;
   fl.headingRow   = fl.contentRow.previousSibling;
   
   // Find cell's position within row.
     
   var counter = 0;
   var cell = fl.contentCell
   while (cell.previousSibling != null) {
     counter ++;
     cell = cell.previousSibling;
   }
   
   // Find the corresponding Heading Cell
   
   cell = fl.headingRow.firstChild
   for (var i = 0; i < counter; i++) {
   	  cell = cell.nextSibling;
   }
   fl.headingCell = cell;
   
   return fl;
}

function insertField(target,name) {
  
   // target is the 'IMG' element that was clicked on to open the field menu.

   closeModalDialog("newFieldDialog");

	 var fl = getFieldLocator(target);

   fl.headingRow.insertBefore(createHeadingCell(name),fl.headingCell);
   fl.contentRow.insertBefore(createInputCell(name),fl.contentCell);
   
   // Shuffle the remaining Content Cells forwards one position
   
   while (fl.contentRow.childNodes.length > 4) {
   	 if (fl.contentRow.nextSibling == null) {
   	 	 fl.contentRow.parentNode.appendChild(createTableHeader());
   	 	 fl.contentRow.parentNode.appendChild(createTableRow());
   	 }
     var newHeadingRow = fl.contentRow.nextSibling;
     var newContentRow = newHeadingRow.nextSibling;
     if (newHeadingRow.childNodes.length == 0) {
     	 newHeadingRow.appendChild(headingRow.removeChild(fl.headingRow.lastChild));
     	 newContentRow.appendChild(contentRow.removeChild(fl.contentRow.lastChild));
   	 }
   	 else {
   	 	 newHeadingRow.insertBefore(fl.headingRow.removeChild(fl.headingRow.lastChild),newHeadingRow.firstChild);
   	 	 newContentRow.insertBefore(fl.contentRow.removeChild(fl.contentRow.lastChild),newContentRow.firstChild);
   	 }

   	 fl.headingRow = newHeadingRow;
   	 fl.contentRow = newContentRow;

   }
}

function removeField(target) {

   // Get the Field Locator for the target.
   // target is the 'INPUT' element associated with the Menu.
   
   var fl = getFieldLocator(target);

   // Remove the Heading Cell from the Heading Row
   // Remove the Conent Cell from the Content Row.

   fl.headingRow.removeChild(fl.headingCell);
   fl.contentRow.removeChild(fl.contentCell);

   // Shuffle the remaining Content Cells backwards one position

   while (fl.contentRow.nextSibling != null) {
   	 var nextHeadingRow = fl.contentRow.nextSibling
   	 var nextContentRow = nextHeadingRow.nextSibling;
   	 fl.headingRow.appendChild(nextHeadingRow.removeChild(nextHeadingRow.firstChild));
   	 fl.contentRow.appendChild(nextContentRow.removeChild(nextContentRow.firstChild));
   	 fl.headingRow = nextHeadingRow;
   	 fl.contentRow = nextContentRow;
   }

 	 if ((fl.headingRow.children.length == 0) && (fl.headingRow.parentNode.children.length > 2)) {
 	 	 fl.headingRow.parentNode.removeChild(fl.headingRow);
 	 	 fl.contentRow.parentNode.removeChild(fl.contentRow);
 	 }
}

function resetEditDocumentForm() {
	
	target = document.getElementById("editDocument");
	target.innerHTML = "";
	return target;
	
}

function openNewFieldDialog() {
	
	try {
	  var field = document.getElementById("newFieldName");
	  field.value = "";
    $('#newFieldDialog').modal('show')   
	  field.focus();
  }
  catch (e) {                                   	
    handleException('schemalessDevelopmentUI.openEditDocumentDialog',e,null);    
  }                                             

}

function doInsertField(target) {
	
	/*
	**
	** Prepare the New Field Dialog for an Insert Field operation.
	**
	*/
	
	var createFieldButton = document.getElementById("btn.saveNewField");
	createFieldButton.onclick = function(target) { return function() { insertField(target, document.getElementById("newFieldName").value); return false }; }(target);
  $('#newFieldDialog').modal('show')   
		
}

function doAppendField() {
	
	/*
	**
	** Prepare the New Field Dialog for an Append Field operation.
	**
	*/

  try {
  	var target = document.getElementById("editDocument");
  	
  	if (target.childNodes.length == 0) {
  		var table = createTable();
  		target.appendChild(table);
  	  table.appendChild(createTableHeader());
  	  table.appendChild(createTableRow());
  	}
  	var createFieldButton = document.getElementById("btn.saveNewField");
  	createFieldButton.onclick = function(target) { return function() { appendField(document.getElementById("newFieldName").value); return false }; }(target);
    $('#newFieldDialog').modal('show')   
  }
  catch (e) {                                   	
    handleException('schemalessDevelopmentUI.openEditDocumentDialog',e,null);    
  }                                             

}

function clearData() {

	// closeAllDialogs();
  var keyList = document.getElementById("keyList");
	keyList.innerHTML = "";
	var documentList = document.getElementById("showDocumentList");
	documentList.innerHTML = "";

}

function makeEditableDocument(target) {

  // This code needs to manage Nested Objects

  var inputCollection = target.getElementsByTagName("INPUT");
  for (var i=0; i<inputCollection.length; i++) {
    var INPUT = inputCollection[i];
    INPUT.className = "form-control"
    INPUT.placeholder = INPUT.name;
    
    var cell  = INPUT.parentNode;
    cell.removeChild(INPUT);
  	cell.appendChild(addFieldMenu(INPUT));
  }

	var table = target.firstChild;
  var header = table.firstChild
  var row = table.firstChild.nextSibling

	// Split input fields into rows each with at most 4 columns.
  
  while (row.childNodes.length > 4) {
  	var newHeader = createTableHeader();
  	var newRow = createTableRow();
  	
  	// At first glance this appears to be bassackwards

    // Create a New Header and Content rows. 
    // Copy 4 elements from the front of current row 
    // to the newly created row. Rinse and Repeat as 
    // necessary.
  	
  	table.insertBefore(newHeader,header)
  	table.insertBefore(newRow,header)

    for (var i=0; i<4; i++) {
    	newHeader.appendChild(header.removeChild(header.firstChild));
	   	newRow.appendChild(row.removeChild(row.firstChild));
	  } 
  }
}
  
function resetForm() {
  clearData()
  doListCollections();
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

function checkNewCollection() {

  var collectionList = document.getElementById("collectionList");
  var newCollection = document.getElementById("newCollection");
  var existingActions = document.getElementById("existingActions");
  if (collectionList.value == "(new)") {
  	newCollection.style.display="inline-block"
  	existingActions.style.display="none";
  }
  else {
  	newCollection.style.display="none"
  	existingActions.style.display="inline-block";
  }
  clearData();
}

function doCreateCollection() {

  var collectionName = document.getElementById("newCollectionName").value;
  
  if ((typeof collectionName == "undefined") || (collectionName == "")) {
  	showErrorMessage("Please enter collection name");
  	return;
  }
  
  if (checkCollectionName(collectionName) != null) {
  	showErrorMessage("Collection Exists");
  	return;
  }
   
  var postCreateAction = function(XHR,URL) {
	                         showInformationMessage ("Create Collection Complete. Status = " + XHR.status + " (" + XHR.statusText + ")");
	                         document.getElementById("newCollectionName").value = "";
                           doListCollections();
                         }
                        
  restAPI.createCollection(collectionName,null,postCreateAction);                         

}

function doDeleteCollection() {

  var callback = function(XHR,URL) {
  	
  	               var collectionName = getCollectionName();
  	                  
                   if (XHR.status == 200) {
		                 showInformationMessage("Collection " + collectionName + " deleted");
    	               resetForm();
                   }
                   else {
  	                 if (XHR.status == 412) {
  		                  showErrorMessage("Delete Collection Prohibited on Non-Empty Collection");
  	                 }
  	                 else {
		                   showErrorMessage ("doDeleteCollection[" + URL + "]: Operation failed. Status = " + XHR.status + " (" + XHR.statusText + ")");
		                 }
	                 }
	               }
	
	restAPI.setCollectionName(getCollectionName());
	restAPI.dropCollection(callback);
  	
}

function doListCollections() {

	var callback = function(XHR,URL) {
	                jsonDocument = restAPI.processGetResponse(XHR,URL);
			            if (jsonDocument != null) {
                    var optionList = document.getElementById("collectionList")
                    optionList.innerHTML = "";
                    var newOption = new Object();
                    newOption.name = "(new)"
                    jsonDocument.items.unshift(newOption);
                    populateOptionList(optionList,jsonDocument.items,"name");
                    checkNewCollection();
                  }
                }  

	restAPI.getCollectionList(callback)

}                    

function renderKeyList(keyList,collectionName) {
 
   var container = document.getElementById("keyList");
   container.innerHTML = "";

   var SPAN  = document.createElement("SPAN");
   container.appendChild(SPAN);
   SPAN.className = "h5";
   SPAN.textContent = "Key List for \"" + collectionName + "\"";

   var BR  = document.createElement("BR");
   container.appendChild(BR);
   BR  = document.createElement("BR");
   container.appendChild(BR);
 
   var TABLE = document.createElement("TABLE")
   container.appendChild(TABLE);
   TABLE.className = "table table-striped table-bordered";

   var SPAN  = document.createElement("SPAN");
   container.appendChild(SPAN);
   SPAN.className = "h5";

   var results = "Result : ";
   if (keyList.length > 0) {
     results += keyList.length + " Rows selected.";
   }
   else {
     results += "No Rows selected.";
   }

   SPAN.textContent =results;


   for (var i=0; i<keyList.length;i++) {	

     var keyValue = keyList[i].id
	   var TR = TABLE.insertRow(0);
     TR.id = keyValue;

     var TD = TR.insertCell()
          
     /*
     <div class="dropdown">
  		<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown">
    		Dropdown
    		<span class="caret"></span>
  		</button>
  		<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1">
    		<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Action</a></li>
    		<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Another action</a></li>
    		<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Something else here</a></li>
    		<li role="presentation" class="divider"></li>
    		<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Separated link</a></li>
  		</ul>
		 </div>          
     */
     
     var DIV = document.createElement("DIV");
     TD.appendChild(DIV)
     DIV.className = "dropdown";
     
     var BUTTON = document.createElement("BUTTON");
     DIV.appendChild(BUTTON);
     BUTTON.className = "btn btn-default dropdown-toggle"
     BUTTON.type = "button";
     BUTTON.dataset.toggle = "dropdown";
     BUTTON.appendChild(document.createTextNode("Action "));
     
     var SPAN = document.createElement("SPAN");
     BUTTON.appendChild(SPAN);
     SPAN.className = "caret";
     
     var UL = document.createElement("UL");
     DIV.appendChild(UL);
     UL.className = "dropdown-menu";
     UL.role = "menu"
     
     var LI = document.createElement("LI");
     LI.role="presentation";
     UL.appendChild(LI);
     
     var A = document.createElement("A");
     LI.appendChild(A);
     A.role="menuitem" 
     A.onclick = function(collection,key) { return function() { doUpdateDocument(collection,key); }; }(collectionName,keyValue);
     A.tabindex="-1"
     A.href="#"

     var ICON = createIcon("/XFILES/lib/icons/json_update_document.png","Edit Document");
     A.appendChild(ICON)
     A.appendChild(document.createTextNode(" Update Document"))
     
     var LI = document.createElement("LI");
     LI.role="presentation";
     UL.appendChild(LI);
     
     var A = document.createElement("A");
     LI.appendChild(A);
     A.role="menuitem" 
     A.onclick = function(collection,key) { return function() { doDuplicateDocument(collection,key); }; }(collectionName, keyValue);
     A.tabindex="-1"
     A.href="#"

     var ICON = createIcon("/XFILES/lib/icons/json_create_document.png","Clone Document");
     A.appendChild(ICON)
     A.appendChild(document.createTextNode(" Duplicate Document"));

          
     var LI = document.createElement("LI");
     LI.role="presentation";
     UL.appendChild(LI);
     
     var A = document.createElement("A");
     LI.appendChild(A);
     A.role="menuitem" 
     A.onclick = function(collection,key) { return function() { doDeleteDocument(collection,key); }; }(collectionName,keyValue);
     A.tabindex="-1"
     A.href="#"

     var ICON = createIcon("/XFILES/lib/icons/json_delete_document.png","Delete Document");
     A.appendChild(ICON)
     A.appendChild(document.createTextNode(" Delete Document"))
              
     var LI = document.createElement("LI");
     LI.role="presentation";
     UL.appendChild(LI);
     
     var A = document.createElement("A");
     LI.appendChild(A);
     A.role="menuitem" 
     A.onclick = function(collection,key) { return function() { doCreateTemplate(collection,key); }; }(collectionName,keyValue);
     A.tabindex="-1"
     A.href="#"

     var ICON = createIcon("/XFILES/lib/icons/json_create_collection.png","Create Template");
     A.appendChild(ICON)
     A.appendChild(document.createTextNode(" Save Template"));
     
     var TD = TR.insertCell()
     
     var A = document.createElement("A")
     TD.appendChild(A);
     A.title = "Fetch Document"
     A.href = '#';
     A.onclick = function(collection,key) { return function() { doUpdateDocument(collection,key); }; }(collectionName,keyValue);
     TXT = document.createTextNode(keyValue);
     A.appendChild(TXT);

   }

   container.style.display="block";

}

function doGetKeys() {

  var callback = function(XHR,URL) {
     		            jsonDocument = restAPI.processGetResponse(XHR,URL);
				            if (jsonDocument != null) {
  	              	  if (jsonDocument.items.length == 0) {
							          showInformationMessage("No documents found");
		                    clearData();
                      }
                      else {
  	                    renderKeyList(jsonDocument.items,getCollectionName());
                      }                    
                    }
                  }

 	restAPI.setCollectionName(getCollectionName());
	restAPI.getCollection("fields=id",callback);

}

function renderDocuments(jsonObject) {

	var target = document.getElementById("showDocumentList")
	target.style.display="block";
	
	target.innerHTML = "";
	var table = jRenderer.addTable(target);
  var header = jRenderer.addHeader(table);
  var hcell = jRenderer.addCell(header);
  hcell.appendChild(document.createTextNode("ID"))
	for (var i=0; i < jsonObject.length; i++) {
    var row = jRenderer.addRow(table);
    var cell1 = jRenderer.addCell(row);
    cell1.appendChild(document.createTextNode(jsonObject[i].id))
    var cell2 = jRenderer.addCell(row);
	  jRenderer.renderJsonObject(cell2,jsonObject[i].value);
	}
	
}

function doGetDocuments() {

	var callback = function(XHR,URL) {
	                jsonDocument = restAPI.processGetResponse(XHR,URL);
			            if (jsonDocument != null) {
                	  if (jsonDocument.items.length == 0) {
                      showInformationMessage("No documents found");
                    }
                    else {
                   	  renderDocuments(jsonDocument.items);
                    }
	                }  
	              }
	
  restAPI.setCollectionName(getCollectionName());
	restAPI.getCollection(null,callback);

}

function doCreateTemplate(collectionName,keyValue) {

  var ICON = document.getElementById("btn.SaveNewTemplate");
  ICON.onclick = function(collection,keyValue) { return function() { doSaveTemplate(collection,keyValue); }; }(collectionName, keyValue);

	var field = document.getElementById("newTemplateName");
	field.value = "";
	$('#newTemplateDialog').modal('show') 
	field.focus();

}

function doSaveTemplate(collectionName,keyValue) {

  closeModalDialog("newTemplateDialog");

	var callback = function(XHR,URL) {
	                jsonDocument = restAPI.processGetResponse(XHR,URL);
			            if (jsonDocument != null) {
                    var name = document.getElementById("newTemplateName").value;
	                  saveTemplate(name,jsonDocument)
                  }
                }  

  restAPI.setCollectionName(collectionName);
  restAPI.getDocument(keyValue,callback)
	
}

function doCreateDocument() {
	
  /*
  **
  ** Set the 'Save' action on the Edit Document form to createDocument()
  **
  */

 
	var target = resetEditDocumentForm();
  var ICON = document.getElementById("btn.saveEditDocument");
  ICON.onclick = function(inputContainer,collection) { return function() { createDocument(inputContainer,collection); }; }(target, getCollectionName());

  getTemplateList();
  $('#editDocumentDialog').modal('show');

}

function queryCollection(inputContainer,collectionName) {

	var jsonObject = rowToJson(inputContainer);
	var callback = function(XHR,URL) {	
    								$('#editDocumentDialog').modal('hide') 
    		            jsonDocument = restAPI.processGetResponse(XHR,URL);
				            if (jsonDocument != null) {
  	              	  if (jsonDocument.items.length == 0) {
		                    showInfromation("No documents found");
                      }
                      else {
                     	  renderDocuments(jsonDocument.items);
                      }
                    }
  		   			    };
    
    restAPI.setCollectionName(collectionName)
    restAPI.postDocument("action=query",jsonObject,callback)

}

function doQueryCollection(collection) {

  /*
  **
  ** Set the 'Save' action on the Edit Document form to createDocument()
  **
  */

 
	var target = resetEditDocumentForm();
  var ICON = document.getElementById("btn.saveEditDocument");
  ICON.onclick = function(inputContainer,collection) { return function() { queryCollection(inputContainer,collection); }; }(target, getCollectionName());

  getTemplateList();

  $('#editDocumentDialog').modal('show')    
;

}
	
function doUpdateDocument(collection, key) {
		
  /*
  **
  ** Set the 'Save' action on the Edit Document form to updateDocument()
  **
  */

	var target = document.getElementById("editDocument");
  var ICON = document.getElementById("btn.saveEditDocument");
  ICON.onclick = function(inputContainer,collection,key) { return function() { updateDocument(inputContainer,collection,key); }; }(target, collection, key);

  var templateList = document.getElementById("templateList");
  templateList.style.display = "NONE";

	var callback = function(XHR,URL) {
	                jsonDocument = restAPI.processGetResponse(XHR,URL);
			            if (jsonDocument != null) {
                    target = resetEditDocumentForm()
	                  jRenderer.renderJsonInput(target,jsonDocument);
          
                    makeEditableDocument(target);
                    $('#editDocumentDialog').modal('show')                       
                    var inputCollection = target.getElementsByTagName("INPUT");
                    inputCollection[0].focus();
                  }
                }  

	/*
	**
	** Get the document to be updated and open the Edit Document Dialog
	**
	*/

  restAPI.setCollectionName(collection);
  restAPI.getDocument(key,callback)
	
}

/*
**
** Delete Document
**
*/

function doDeleteDocument(collection,key) {
	
  var callback = function(XHR,URL) { 
	                 var row = document.getElementById(key);
                   row.parentNode.removeChild(row);
      				     showInformationMessage ("Delete Complete. Status = " + XHR.status + " (" + XHR.statusText + ")");
      				   }

  restAPI.setCollectionName(collection)
  restAPI.deleteDocument(key,callback)
  
}

/*
**
** Duplicate Document
**
*/

function doDuplicateDocument(collection, key) {
	
  /*
  **
  ** Set the 'Save' action on the Edit Document form to createDocument()
  **
  */

	var target = document.getElementById("editDocument");
  var ICON = document.getElementById("btn.saveEditDocument");
  ICON.onclick = function(inputContainer,collection) { return function() { createDocument(inputContainer,collection); }; }(target, collection);

	/*
	**
	** Get the document to be duplicated and open the Edit Document Dialog
	**
	*/

	var callback = function(XHR,URL) {
	                jsonDocument = restAPI.processGetResponse(XHR,URL);
			            if (jsonDocument != null) {
	                  target = resetEditDocumentForm()
	                  jRenderer.renderJsonInput(target,jsonDocument);

                    makeEditableDocument(target);
                    $('#editDocumentDialog').modal('show');
                    var inputCollection = target.getElementsByTagName("INPUT");
                    inputCollection[0].focus();
                  }
                }  

  restAPI.setCollectionName(collection);
  restAPI.getDocument(key,callback)
	
}

function onDragStart(ev) {
  ev.dataTransfer.setData("Text",ev.target.id);
	console.log(ev.target.id);
} 

function enableDrop(ev) {
 //  ev.preventDefault();
}

function onDrop(ev) {
	 if (ev.preventDefault) {
 		 ev.preventDefault();
 	 }
   var data=ev.dataTransfer.getData("Text");
   if (data == 'removeField') {
   	 deleteField(ev.srcElement);
   }
   return false;
}

function onPageLoaded() {
	doListCollections();
}

/*
**
** Create Document
**
*/

function createDocument(inputContainer,collectionName) {

	var jsonObject = rowToJson(inputContainer);

	var callback = function(XHR,URL) {	
                   status = restAPI.processPutResponse(XHR,URL);
    							 $('#editDocumentDialog').modal('hide') 
    	   				};


  restAPI.setCollectionName(collectionName);
  if (serverAssignedKeys) {
    restAPI.postDocument(null,jsonObject,callback)
  }
  else {
  	var newGuid = guid();
    restAPI.putDocument(newGuid,jsonObject,callback)
  }

}

/*
**
** Update Document
**
*/

function updateDocument(inputContainer,collectionName,key) {

	var jsonObject = rowToJson(inputContainer);
	var callback = function(XHR,URL) {	
                   status = restAPI.processPutResponse(XHR,URL);
    							 $('#editDocumentDialog').modal('hide') 
     					   };

  restAPI.setCollectionName(collectionName);
  restAPI.putDocument(key,jsonObject,callback)

}

function generateTemplate(object) {

  var template = new Object();
  for (var key in object) {
  	var item = object[key]
    if ((typeof item == "string") || (typeof item == "number") || (typeof item == "boolean")) {
      template[key] = null;
    }
    else {
   	  if (typeof jsonItem == "object") {
     	  if (jsonItem instanceof Array) {
     	  	template[key] = new Array();
        	for (var i = 0; i < jsonItem.length; i++) {
        		var item = jsonItem[i]
            if ((typeof item == "string") || (typeof item == "number") || (typeof item == "boolean")) {
              template[key][i] = null;
            }
            else {
        		  template[key][i] = generateTemplate(item)
        		}
      	  }
  		  }
  	    else {
  	      template[key] = generateTemplate(item);
  	    }
  	  }
  	}
  }
  return template
}

function createTemplateCollection(name,object) {
	
  var collectionName = "TEMPLATES";
  
  var postCreateAction = function(name,object) { 
  	                       return function(XHR,URL) { 
                                    if (XHR.status == 201) {
                                    	// Template Collection successfully created
                                    	saveTemplate(name,object);
                         	          }
                         	          else {
                                    	showErrorMessage("Unable to save Template. Status : " + XHR.status + " (" + XHR.statusText + ")");
                                    }
                                  }; 
                           } (name,object);                           	 


  var collectionSpec = new Object();
  collectionSpec.tableName = collectionName

  collectionSpec.contentColumn = new Object();
  collectionSpec.contentColumn.name = 'JSON_CONTENT';
  collectionSpec.contentColumn.sqlType = "CLOB";
  
  if ((collectionSpec.contentColumn.sqlType == 'CLOB') || (collectionSpec.contentColumn.sqlType == 'BLOB')) { 
    collectionSpec.contentColumn.compress = "MEDIUM";
    collectionSpec.contentColumn.cache = true;
  }

  collectionSpec.keyColumn = new Object();
  collectionSpec.keyColumn.name = 'ID'
  collectionSpec.keyColumn.sqlType = 'VARCHAR2';
  collectionSpec.keyColumn.maxLength = 64;
  collectionSpec.keyColumn.assignmentMethod = "CLIENT"
  
  collectionSpec.creationTimeColumn = new Object();
  collectionSpec.creationTimeColumn.name = "CREATED_ON";

  collectionSpec.lastModifiedColumn = new Object();
  collectionSpec.lastModifiedColumn.name =  "LAST_MODIFIED";

  collectionSpec.versionColumn = new Object();
  collectionSpec.versionColumn.name = "VERSION"; 
  collectionSpec.versionColumn.method = "SHA256";

  collectionSpec.readOnly = false;
          
  restAPI.createCollection("TEMPLATES",collectionSpec,postCreateAction);                         
}

function saveTemplate(name, object) {
	
  var checkTemplateStatus = function(name,object) { 
  	                          return function(XHR,URL) { 
                                       if (XHR.status == 404) {
                                        // Template Collection not found..
                                       	createTemplateCollection(name,object);
                           	           }
                           	           else {
                                         if (XHR.status != 200) {
                                         	showErrorMessage("Unable to save Template. Status : " + XHR.status + " (" + XHR.statusText + ")");
                                         }
                                         else {
                                         	showInformationMessage("Template \"" + name + "\" added to TEMPLATES collection");
                                         }
                                       }
                                     }; 
                            } (name,object);                           	 

	 var template = generateTemplate(object);	 

   restAPI.setCollectionName("TEMPLATES");
   restAPI.putDocument(name,template,checkTemplateStatus)

}

function getTemplateList() {
	
		var callback = function(XHR,URL) {
								     var templateList = document.getElementById("templateList");
                 	   templateList.style.display = "none";
								 	   if (XHR.status == 200) {
								 	   	 var jsonDocument;
								     	 try {
								         jsonDocument = JSON.parse(XHR.responseText);
                         if (jsonDocument.items.length > 0) {
                         	 templateList.style.display = "inline-block";
  	                       var noTemplate = new Object();
  	                       noTemplate.id = "(none)";
	                         jsonDocument.items.unshift(noTemplate);
	                         populateOptionList(templateList,jsonDocument.items,"id");
	                       }
  							       }
								       catch (e) {
								       	 self.showErrorMessage("getTemplateList: Error parsing JSON response. (" + e.message + ")",URL);
								      	 return null;
								     	 }
								     }
								     else if (XHR.status == 404) {
		 						     }
		 						     else {
								       self.showErrorMessage("getTemplateList: Operation failed. Status = " + XHR.status + " (" + XHR.statusText + ")",URL);
								    	 return null;
								   	 }
	                 }
	
  restAPI.setCollectionName("TEMPLATES");
	restAPI.getCollection("fields=id", callback);

}

function useTemplate() {

  var collectionName = getCollectionName();
 
  closeModalDialog("useTemplateDialog");
  
  /*
  **
  ** Set the 'Save' action on the Edit Document form to createDocument()
  **
  */

	var target = document.getElementById("editDocument");
  var ICON = document.getElementById("btn.saveEditDocument");
  ICON.onclick = function(inputContainer,collection) { return function() { createDocument(inputContainer,collection); }; }(target, collectionName);

  var templateList = document.getElementById("templateList");
	var templateName = templateList.value;
  
  if (templateName != "(none)") {
	
  	/*
	  **
	  ** Get the Template and open the Edit Document Dialog
	  **
	  */

    
		var callback = function(XHR,URL) {
			               jsonDocument = restAPI.processGetResponse(XHR,URL);
			               if (jsonDocument != null) {
	                     target = resetEditDocumentForm()
	                     jRenderer.renderJsonInput(target,jsonDocument);  
                       makeEditableDocument(target);
                       $('#editDocumentDialog').modal('show');
                     }
                   }

    restAPI.setCollectionName("TEMPLATES");
	  restAPI.getDocument(templateName, callback);
	  
	}
	else {
    resetEditDocumentForm();
    $('#editDocumentDialog').modal('show');
  }    
}

function init() {

  try {
    initCommon();
    initRestLogin();
    if (isORDS) {
		  restAPI.setORDS();
		  restAPI.setSchema("scott");
		  var pwd = document.getElementById("sqlPassword");
		  pwd.parentNode.removeChild(pwd);
    }
    else {
    	restAPI.setServletRoot('/DBJSON');
    }
  	doListCollections();
  }
  catch (e) {
    handleException('schemalessDevelopmentUI.init',e,null);
  }
}

