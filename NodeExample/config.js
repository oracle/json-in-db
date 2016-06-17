var fs = require('fs');

var configData = fs.readFileSync('config.json');
var config = JSON.parse(configData);         
var dataSourceData = fs.readFileSync('dataSources.json');
var dataSources = JSON.parse(dataSourceData);

module.exports.config = config;
module.exports.dataSources = dataSources;

