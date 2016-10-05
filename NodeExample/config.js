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
 
"use strict";

var fs = require('fs');

var configData = fs.readFileSync(__dirname + '/config.json');
var config = JSON.parse(configData);         
var dataSourceData = fs.readFileSync(__dirname + '/dataSources.json');
var dataSources = JSON.parse(dataSourceData);

module.exports.config      = config;
module.exports.dataSources = dataSources;
module.exports.updateKeys  = updateKeys;

function updateKeys(googleKey,tmdbKey) {
	dataSources.tmdb.apiKey = tmdbKey;
	dataSources.google.apiKey = googleKey;
  fs.writeFileSync('dataSources.json',JSON.stringify(dataSources,null,2));
}

