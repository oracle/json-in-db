import * as MuConstants from '../exports/MuConstants'

const service = MuConstants.STORIES_SERVICE_URL

function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

// Get stories of a given type - HTTP GET request
export function getStories(type) {
  var endpoint = service + type;
  return fetch(endpoint, {
    method: "GET"
  }).then(handleErrors).then(res => res.json())
}

// Add story - HTTP POST request
export function addStory(story) {
  var endpoint = service;
  return fetch(endpoint, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story)
  }).then(handleErrors).then(res => res.json())
}

// Update story - HTTP PUT request
export function replaceStory(story) {
  var endpoint = service + story.key;
  return fetch(endpoint, {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story)
  }).then(handleErrors)
}

// Remove story using key - HTTP DELETE request
export function removeStory(key) {
  var endpoint = service + key;
  return fetch(endpoint, {
    method: "DELETE"
  }).then(handleErrors)
}