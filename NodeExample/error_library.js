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

 // Create a new object, that prototypally inherits from the Error constructor

module.exports.GenericException = GenericException
module.exports.ExternalError = ExternalError

function GenericException(message, details) {
  this.name    = 'GenericException';
  this.message = 'Unexpected exception encountered';
  if (message !== undefined) {
    this.message = message
  }
  
  if (details.status !== undefined ) {
    this.status = details.status
	delete details.status
  }

  if (details.stack !== undefined) {
    this.stack = details.stack
	delete details.stack
  }
  else {
    if ((details.underlyingCause) && (details.underlyingCause.stack !== undefined)) {
      this.stack = details.underlyingCause.stack;
	  delete details.underlyingCause.stack;
    }
  }

  if (details.elapsedTime) {
	this.elapsedTime = details.elapsedTime
  }
 
  this.details = details
}

GenericException.prototype = Object.create(Error.prototype);
GenericException.prototype.constructor = GenericException;

function ExternalError(details) {
  this.name    = 'ExternalError';
  this.message = 'Unexpected error while accessing external data source:';
  this.stack   = details.cause.stack;
  this.details = details
}

ExternalError.prototype = Object.create(Error.prototype);
ExternalError.prototype.constructor = ExternalError;

function generateSummary(documents) {
	
	return { documentCount : documents.length, firstDocument: documents[0], lastDocument : documents[documents.length-1]}

}