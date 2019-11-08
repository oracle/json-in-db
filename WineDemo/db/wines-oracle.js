

var oracledb = require('oracledb');

var config = {
  user: process.env.NODE_ORACLEDB_USER || "scott",
  password: process.env.NODE_ORACLEDB_PASSWORD || "tiger",
  connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "172.17.0.2/orclpdb",
  poolMin: 10,
  poolMax: 10,
  poolIncrement: 0
}

async function initialize() {
  oracledb.autoCommit = true;
  await oracledb.createPool(config);
  var conn = await oracledb.getConnection();
  var soda = conn.getSodaDatabase();
  var collection = await soda.createCollection('wines');
  await collection.createIndex({ "name" : "WINE_IDX" });
}

async function close() {
  await oracledb.getPool().close();
}

async function get(qbe) {
  var conn = await oracledb.getConnection();
  var collection = await getCollection(conn);
  var builder = collection.find();
  if (qbe != null) {
    builder.filter(JSON.parse(qbe));
  }
  var docs = await builder.getDocuments();
  var res = toJSON(docs);
  conn.close();
  return res;
}

async function update(id, review) {
  delete review.id;
  var conn = await oracledb.getConnection();
  var collection = await getCollection(conn);
  var result = await collection.find().key(id).replaceOne(review);
  conn.close();
  return result;
}

async function create(review) {
  var conn = await oracledb.getConnection();
  var collection = await getCollection(conn);
  var result = await collection.insertOneAndGet(review);
  var key = result.key;
  conn.close();
  return key;
}

async function remove(id) {
  var conn = await oracledb.getConnection();
  var collection = await getCollection(conn);
  var res = await collection.find().key(id).remove();
  conn.close();
}

function code() {
  str = `    var wine = request.body;
    var id = wine.id;
    var soda = conn.getSodaDatabase();
    var collection = await soda.openCollection("wines");
    await collection.find().key(id).replaceOne(wine);
`;
  return JSON.stringify({"value":str});
}

async function getCollection(conn) {
  var soda = conn.getSodaDatabase();
  return await soda.openCollection('wines');
}

function toJSON(documents) {
  var result = [];
  for (let i = 0; i < documents.length; i++) {
    var doc = documents[i];  // the document (with key, metadata, etc)
    var key = doc.key;     
    content = doc.getContent();
    content.id = key;        // inject key into content 
    result.push(content);
  }
  return result;
}

module.exports.initialize = initialize;
module.exports.close = close;
module.exports.get = get;
module.exports.update = update;
module.exports.create = create;
module.exports.remove = remove;
module.exports.code = code;
