import * as MuConstants from '../exports/MuConstants'

// Copy a story object
export function cloneStory(story) {
  var _story = {
    key: story.key,
    content: {
      type: story.content.type,
      points: story.content.points,
      title: story.content.title,
      subtitle: story.content.subtitle,
      description: story.content.description
    }
  };
  return _story;
}

// Convert header type to story type ('In Progress' -> 'in-progress')
export function toStoryType(headerType) {
  var type;

  if (headerType == MuConstants.STORY_HEADER_TODO)
    type = MuConstants.STORY_TYPE_TODO;
  else if (headerType == MuConstants.STORY_HEADER_INPROGRESS)
    type = MuConstants.STORY_TYPE_INPROGRESS;
  else if (headerType == MuConstants.STORY_HEADER_COMPLETED)
    type = MuConstants.STORY_TYPE_COMPLETED;

  return type;
}

// Convert story type to header type ('in-progress' -> 'In Progress')
export function toHeaderType(storyType) {
  var type;

  if (storyType == MuConstants.STORY_TYPE_TODO)
    type = MuConstants.STORY_HEADER_TODO;
  else if (storyType == MuConstants.STORY_TYPE_INPROGRESS)
    type = MuConstants.STORY_HEADER_INPROGRESS;
  else if (storyType == MuConstants.STORY_TYPE_COMPLETED)
    type = MuConstants.STORY_HEADER_COMPLETED;

  return type;
}

export function toDecorType(storyType) {
  var type;

  if (storyType == MuConstants.STORY_TYPE_TODO)
    type = 'danger';
  else if (storyType == MuConstants.STORY_TYPE_INPROGRESS)
    type = 'warning';
  else if (storyType == MuConstants.STORY_TYPE_COMPLETED)
    type = 'success';

  return type;
}

export function toDecorType2(headerType) {
  var type;

  if (headerType == MuConstants.STORY_HEADER_TODO)
    type = 'danger';
  else if (headerType == MuConstants.STORY_HEADER_INPROGRESS)
    type = 'warning';
  else if (headerType == MuConstants.STORY_HEADER_COMPLETED)
    type = 'success';

  return type;
}