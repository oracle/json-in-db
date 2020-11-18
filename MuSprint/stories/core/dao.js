var oracledb = require('oracledb');

const collname = 'mustories'

// Open stories collection using a connection
async function openCollection(conn) {
	var soda = conn.getSodaDatabase();
	return await soda.openCollection(collname);
}

// Convert result set objects into JSON array
function toJsonArray(documents) {
	var result = [];
	documents.forEach(function(element) {
		var doc = {};
		doc.key = element.key;
		doc.content = element.getContent();
		result.push(doc);
	});
  return result;
}

// Get all stories of a given type from the SODA collection
async function getStories(t) {
	let conn;
	let coll;
	var stories;
	var result = [];
	var error = null;

	try {
		var qbe;
		// Obtain a connection from the pool and open the SODA collection
		conn = await oracledb.getConnection();
		coll = await openCollection(conn);

		// Use QBE to filter documents based on story type
		qbe = (t == 'all') ? {} : { "type": t };
		stories = await coll.find().filter(qbe).getDocuments();
		result = toJsonArray(stories);
	}
	catch (err) {
		console.error('> Get error: ' + err.message);
		error = err;
	}
	finally {
		if (conn) {
			// Release the connection back to the pool even if error occurred
			try {
				await conn.close();
			}
			catch (err) {
				console.error('> ' + err);
				error = err;
			}
		}
	}
	// If the operation failed throw the error
	if (error)
		throw error;

	return result;
}

// Insert a story and return generated key
async function insertStory(story) {
	let conn;
	let coll;
	var result;
	var error = null;

	try {
		// Obtain a connection from the pool and open the SODA collection
		conn = await oracledb.getConnection();
		coll = await openCollection(conn);

		// Remove story from collection using key
		result = await coll.insertOneAndGet(story.content);
		result = {"key" : result.key,
	            "content" : story.content};
	}
	catch (err) {
		console.error('> Insert error: ' + err.message);
		error = err;
	}
	finally {
		if (conn) {
			// Release the connection back to the pool
			try {
				await conn.close();
			}
			catch (err) {
				console.error('> ' + err);
				error = err;
			}
		}
	}
	// If the operation failed throw the error
	if (error)
		throw error;

	return result;
}

// Replace a story using key
async function replaceStory(key, story) {
	let conn;
	let coll;
	var error;

	try {
		// Obtain a connection from the pool and open the SODA collection
		conn = await oracledb.getConnection();
		coll = await openCollection(conn);

		// Remove story from collection using key
		await coll.find().key(key).replaceOne(story.content);
	}
	catch (err) {
		console.error('> Replace error: ' + err.message);
		error = err;
	}
	finally {
		if (conn) {
			// Release the connection back to the pool
			try {
				await conn.close();
			}
			catch (err) {
				console.error('> ' + err);
				error = err;
			}
		}
	}
	// If the operation failed throw the error
	if (error)
		throw error;
}

// Remove a story using key from the SODA collection
async function removeStory(k) {
	let conn;
	let coll;
	var error;

	try {
		// Obtain a connection from the pool and open the SODA collection
		conn = await oracledb.getConnection();
		coll = await openCollection(conn);

		// Remove story from collection using key
		let result = await coll.find().key(k).remove();
	}
	catch (err) {
		console.error('> Remove error: ' + err.message);
		error = err;
	}
	finally {
		if (conn) {
			// Release the connection back to the pool
			try {
				await conn.close();
			}
			catch (err) {
				console.error('> ' + err);
				error = err;
			}
		}
	}
	// If the operation failed throw the error
	if (error)
		throw error;
}

module.exports.getStories = getStories;
module.exports.insertStory = insertStory;
module.exports.replaceStory = replaceStory;
module.exports.removeStory = removeStory;
