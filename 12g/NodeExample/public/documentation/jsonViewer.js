
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

const jPP = new JSONPrettyPrinter();

function JSONPrettyPrinter() {

  var self = this;

  function addOpenObject(isArray, target) {
  
    span = document.createElement('SPAN');
    target.appendChild(span);
    
    if (isArray) {
      span.className = 'jsonArray';
      span.appendChild(document.createTextNode('['));
    }
    else {
      span.className = 'jsonObject';
    	span.appendChild(document.createTextNode('{'));
    } 
  }

  function addCloseObject(isArray, target) {
  	
    span = document.createElement('SPAN');
    target.appendChild(span);
    if (isArray) {
      span.className = 'jsonArray';
      span.appendChild(document.createTextNode(']'));
    }
    else {
      span.className = 'jsonObject';
    	span.appendChild(document.createTextNode('}'));
    }
  }

  function addName(target,name) {
	  	var span = document.createElement("SPAN");
	  	span.className = "jsonQuote";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode("\""));  	
      
	  	var span = document.createElement("SPAN");
	  	span.className = "jsonName";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode(name));  	

	  	var span = document.createElement("SPAN");
	  	span.className = "jsonQuote";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode("\""));  	

	  	var span = document.createElement("SPAN");
	  	span.className = "jsonSeperator";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode(" : "));  	
  }  	

  function printQuotedString(target,value) {
  	
	  	var span = document.createElement("SPAN");
	  	span.className = "jsonQuote";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode("\""));  	
      
	  	var span = document.createElement("SPAN");
	  	span.className = "jsonValue";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode(value));  	

	  	var span = document.createElement("SPAN");
	  	span.className = "jsonQuote";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode("\""));  	
  }

  function printNullValue(target,value) {
  	
	  	var span = document.createElement("SPAN");
	  	span.className = "jsonValue";
	    target.appendChild(span);
	    span.appendChild(document.createTextNode("null"));  	
  }
  
  function getSeperatorLocation(target) {
  	  target = target.previousSibling;
  	  while (target.nodeName == "DIV") {
  	    target = target.lastChild;
      }
      return target;
  }
  	
  function addSeperator(target) {
	  	var span = document.createElement("SPAN");
	  	span.className = "jsonSeperator";
	    target.appendChild(span);
  	  span.appendChild(document.createTextNode(","))
  }

  function addToggleControl(target,iconPath, hint) { 
      toggleControl = document.createElement('a');
      target.appendChild(toggleControl);
      toggleControl.className = 'openClose';
      toggleControl.href = '#';
      toggleControl.title = hint
      
      if (toggleControl.addEventListener) {
  	    toggleControl.addEventListener("click", self.toggleShowChildren, false);
	    }
      else {
 	      toggleControl.attachEvent("onclick", self.toggleShowChildren);
      }
      img = document.createElement("IMG");
      toggleControl.appendChild(img);
      img.style.display="block";
      img.src = iconPath;
      img.style.height="16px";
      img.style.width="16px";
      img.style.border="0px";
  }
  
  function requiresMultilineLayout(jsonObject) {

    if (jsonObject instanceof Array) {
    	if (jsonObject.length > 1) {
    	  // Check for Array of Scalar Values 
    	  for (var i=0; i<jsonObject.length;i++) {
    	  	if (requiresMultilineLayout(jsonObject[i])) {
    	  	  return true;
    	  	}
    	  }
    	  return false;
    	}
    	else {
    	  if ((jsonObject[0] instanceof Array) || (jsonObject[0] instanceof Object)) {
    			return requiresMultilineLayout(jsonObject[0]);
    	  }
    	}
    }
  
    if (jsonObject instanceof Object) {
      if (Object.keys(jsonObject).length > 1 ) {
        return true;
      }
      else {
 	  	  for ( var prop in jsonObject) {
      	  if ((prop instanceof Array) || (prop instanceof Object)) {
      			return requiresMultilineLayout(prop);
    	    }
    	  }
    	}    
    }
    
    return false;      
     
  }
  	
  function printObject(innerJson,target,name,myContentModel) {

    var objectContainer
    var expandedObject
    var collapsedObject
    var containerType;
    var contentModel
    var isArray
    
    // Attempt to print nested structures where arrays have only 1 member and objects have only 1 property on 1 line.
    // If any of the Inner objects have are Arrays with more than 1 member or objects have more than 1 property use a Multiline format to display this object.
    
    var multilineLayout = false;
 		multilineLayout = requiresMultilineLayout(innerJson) 		
    
    if (innerJson instanceof Array) {
  		isArray = true;
  	}
  	else {
      isArray = false;
    }
    
    containerType = "SPAN"
    contentModel = "singletonContent";
    if (multilineLayout) {
      containerType = "DIV";
      contentModel = "repeatingContent";
    }

    objectContainer = document.createElement(containerType);
    target.appendChild(objectContainer);
    
    expandedObject = document.createElement(containerType);
    objectContainer.appendChild(expandedObject);
    expandedObject.className = myContentModel;
    // expandedObject.style.display = "inline-block";
  
    if (multilineLayout) {
      expandedObject.className = "complexContent";
      expandedObject.style.display = "none";
    	// Add a collapsed object before the open object
    	collapsedObject = document.createElement("SPAN");
      objectContainer.insertBefore(collapsedObject,expandedObject);
      collapsedObject.className = "complexContent";
    	collapsedObject.style.display = "block";
      addToggleControl(collapsedObject,'expand_object.png','Show Children');
      if (name != null) {
      	addName(collapsedObject,name);
      }
      addOpenObject(isArray, collapsedObject);
    	var collapsedContent = document.createElement("SPAN");
    	collapsedObject.appendChild(collapsedContent);
    	collapsedContent.className = 'textValue';
    	collapsedContent.appendChild(document.createTextNode(" ... "));
      addCloseObject(isArray, collapsedObject);  	

      addToggleControl(expandedObject,'collapse_object.png','Hide Children');
    }

    if (name != null) {
    	addName(expandedObject,name);
    }
    addOpenObject(isArray, expandedObject);
    
      	        
    // ProcessContent 
    
  	var contentObject = expandedObject;
  	
    if (isArray) {
      for (var i=0; i<innerJson.length;i++) {
      	var jsonItem = innerJson[i];
      	if (multilineLayout) {
      	  contentObject = document.createElement("DIV");
      	  expandedObject.appendChild(contentObject);
       	}
        if (i>0) {
        	var target = contentObject;
        	if (multilineLayout) {
        	  target = getSeperatorLocation(target);
        	}
        	addSeperator(target)
        }    
        contentObject = self.printJson(contentObject,null,jsonItem,contentModel);
      }
    }
    else {
  	  var first = true;
  	  for ( var prop in innerJson) {
      	if (multilineLayout) {
      	  contentObject = document.createElement("DIV");
      	  expandedObject.appendChild(contentObject);
      	}
        if (!first) {
        	var target = contentObject;
        	if (multilineLayout) {
        	  target = getSeperatorLocation(target);
        	}
          addSeperator(target)
     	  }
        contentObject = self.printJson(contentObject,prop,innerJson[prop],contentModel);
        first = false;
      }
    }

    if (multilineLayout) {
      var indent = document.createElement("DIV");
      expandedObject.appendChild(indent);
      indent.className = "complexContent";
      addCloseObject(isArray,indent);
    }
    else {
 	    addCloseObject(isArray,expandedObject);
    }
          	
    return objectContainer;

  }

  function printNull(target,propertyName,contentModel) {
   	var container = document.createElement("SPAN");
   	container.className = contentModel
		target.appendChild(container);
	  if (propertyName != null) {
	  	addName(container,propertyName);
    }
    printNullValue(container);
    return container;
  }


  function printString(target,propertyName,innerJson,contentModel) {
   	var container = document.createElement("SPAN");
   	container.className = contentModel
		target.appendChild(container);
	  if (propertyName != null) {
	  	addName(container,propertyName);
    }
    printQuotedString(container,innerJson);
    return container;
  }

  function printNumber(target,propertyName,innerJson,contentModel) {
   	var container = document.createElement("SPAN");
   	container.className = contentModel
		target.appendChild(container);
	  if (propertyName != null) {
	  	addName(container,propertyName);
    }
    span = document.createElement("SPAN");
    span.className = "jsonValue"
    container.appendChild(span)
    span.appendChild(document.createTextNode(innerJson));
    return container;
  }

  function printBoolean(target,propertyName,innerJson,contentModel) {
   	var container = document.createElement("SPAN");
   	container.className = contentModel
		target.appendChild(container);
	  if (propertyName != null) {
	  	addName(container,propertyName);
    }
    span = document.createElement("SPAN");
    span.className = "jsonValue"
    container.appendChild(span)
    span.appendChild(document.createTextNode(innerJson));
    return container;
  }

  this.printJson = function (output,name,innerJson,contentModel) {

    if (innerJson == null) {
      return printNull(output,name,contentModel);
    }
    if (typeof innerJson == "string") {
      return printString(output,name,innerJson,contentModel);
    }
    else if (typeof innerJson == "number") {
      return printNumber(output,name,innerJson,contentModel);
    }
    else if (typeof innerJson == "boolean") {
      return printBoolean(output,name,innerJson,contentModel);
    }
    else if (typeof innerJson == "object") {
  	  return printObject(innerJson,output,name,contentModel);
    }
    else {
      alert('Missing logic for ' || typeof innerJson);
    } 
  }
  
  this.toggleShowChildren = function (event) {
 
    var anchorElement;
    var collapsedView;
    var expandedView;
    
    if (window.event) { 
    	event = window.event; 
    }
    
    if  (event.srcElement) {
    	anchorElement = event.srcElement.parentNode;
    	collapsedView = anchorElement.parentElement.parentElement.firstChild;
      expandedView = collapsedView.nextSibling;;
    }
    else {
    	anchorElement = event.target.parentNode;
    	collapsedView = anchorElement.parentElement.parentElement.firstChild;
    	expandedView = collapsedView.nextSibling;;
    }

    if (collapsedView.style.display == "block") {                                 
  		collapsedView.style.display = "none";                                       
  	  expandedView .style.display = "block"                           
  	}                                                                           
  	else {                                                                      
  		collapsedView.style.display = "block";                                    
  		expandedView.style.display = "none";                                    
  	}           	
  	
  	if (event.preventDefault) {
  		event.preventDefault();
  		event.stopPropagation();
  	}
		else {
			event.returnResult = false;
			event.cancelBubble = true;
		}
		
		anchorElement.focus();
		return false;
  }
}