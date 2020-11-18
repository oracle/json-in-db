var express = require('express');
var router = express.Router();
var dao = require('./dao');

// GET  /stories/{type}
router.get('/:type', async function (request, response, next) {
	try {
		var docs = await dao.getStories(request.params.type, next);
		response.json(docs);
	}
	catch (error) {
		// Fallback to default error handler
		next(error);
	}
});

// POST  /stories/
router.post('/', async function (request, response, next) {
	var story = request.body;

	// Reject bad requests
	if (story == null || story.content == null)
		return response.status(400).json({"message":"Story content cannot be null"});

	try {
		story = await dao.insertStory(story, next);
		response.json(story);
	}
	catch(error) {
		// Fallback to default error handler
		next(error);
	}
});

// PUT  /stories/{id}
router.put('/:id', async function (request, response, next) {
	var key = request.params.id;
	var story = request.body;

	// Reject bad requests
	if (story == null || story.content == null)
		return response.status(400).json({"message":"Story content cannot be null"});

	try {
		await dao.replaceStory(key, story, next);
		response.sendStatus(200);
	}
	catch(error) {
		// Fallback to default error handler
		next(error);
	}
});

// DELETE  /stories/{id}
router.delete('/:id', async function (request, response, next) {
	try {
		await dao.removeStory(request.params.id, next);
		response.sendStatus(200);
	}
	catch(error) {
		// Fallback to default error handler
		next(error);
	}
});

module.exports = router;