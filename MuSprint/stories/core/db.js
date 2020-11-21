var oracledb = require('oracledb');
const muserver = require('../exports/server')
const mudb = require('../exports/db')

const collname = 'mustories'

async function initialize() {
  let conn;
  let coll;

  // Create a connection pool which will later be accessed via the
  // pool cache as the 'default' pool.
  await oracledb.createPool({
    user: mudb.user,
    password: mudb.password,
    connectString: mudb.connectString
    // edition: 'ORA$BASE', // used for Edition Based Redefintion
    // events: false, // whether to handle Oracle Database FAN and RLB events or support CQN
    // externalAuth: false, // whether connections should be established using External Authentication
    // homogeneous: true, // all connections in the pool have the same credentials
    // poolAlias: 'default', // set an alias to allow access to the pool via a name.
    // poolIncrement: 1, // only grow the pool by one connection at a time
    // poolMax: 4, // maximum size of the pool. Increase UV_THREADPOOL_SIZE if you increase poolMax
    // poolMin: 0, // start with no connections; let the pool shrink completely
    // poolPingInterval: 60, // check aliveness of connection if idle in the pool for 60 seconds
    // poolTimeout: 60, // terminate connections that are idle in the pool for 60 seconds
    // queueMax: 500, // don't allow more than 500 unsatisfied getConnection() calls in the pool queue
    // queueTimeout: 60000, // terminate getConnection() calls queued for longer than 60000 milliseconds
    // sessionCallback: myFunction, // function invoked for brand new connections or by a connection tag mismatch
    // stmtCacheSize: 30, // number of statements that are cached in the statement cache of each connection
    // _enableStats: false // record pool usage statistics that can be output with pool._logStats()
  });
  oracledb.autoCommit = true;
  console.log('> Database connection pool initialized.');
  conn = await oracledb.getConnection();
  coll = await conn.getSodaDatabase().createCollection(collname);
  console.log('> Stories collection created.');
  await conn.close();
}

async function terminate() {
  // Get the pool from the pool cache and close it when no
  // connections are in use, or force it closed after 10 seconds.
  await oracledb.getPool().close(10);
  console.log('> Database connection pool terminated.');
}

async function ping() {
  // Get a connection and ping the database server
  console.log('> Pinging the database server...')
  let conn = await oracledb.getConnection();
  await conn.ping();
  await conn.close();
  console.log('> Database service reachable.')
}

module.exports.initialize = initialize;
module.exports.terminate = terminate;
module.exports.ping = ping;