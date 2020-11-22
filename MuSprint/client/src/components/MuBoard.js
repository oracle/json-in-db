import React from 'react';
import { Redirect } from 'react-router-dom'

import MuStoryPane from '../components/MuStoryPane'
import MuSaveStoryModal from './MuSaveStoryModal';
import MuDeleteConfirmModal from './MuDeleteConfirmModal';
import * as MuConstants from '../exports/MuConstants'
import { getStories, addStory, replaceStory, removeStory } from '../dispatcher/MuDispatcher';
import { toStoryType, cloneStory } from '../utils/mutils'

class MuBoard extends React.Component {
  constructor() {
    super();
    this.state = {
      stories: [],
      storyToDelete: null,
      activeType: null,
      activeAction: null,
      showSaveStoryModal: false,
      showDeleteConfirmModal: false,
      storyToSave: {
        content: {
          title: '', subtitle: '', points: '', description: '', type: ''
        }
      },
      hasError: null,
      isLoading: true
    };
  };

  componentDidMount() {
    // Send REST request to fetch stories and set them as state
    getStories(MuConstants.STORY_TYPE_ALL)
      .then(stories => this.setState({ stories, isLoading: false }))
      .catch((error) => {
        this.setState({ hasError: true });
      });
  }

  openSaveStoryModal = (activeType, storyToSave, activeAction) => {
    // Set save modal show state to true and remember activeType
    this.setState({ activeType, showSaveStoryModal: true, activeAction })
    if (storyToSave != null) {
      // Copy of the story is mutated and maintained as state, not the source
      this.setState({ storyToSave: cloneStory(storyToSave) })
    }
  }

  closeSaveStoryModal = () => {
    // Set show state of delete modal to false and activeType to null
    this.setState({ activeType: null, showSaveStoryModal: false })
    this.setState({
      storyToSave: {
        content: {
          title: '', subtitle: '', points: '', description: '', type: ''
        }
      }
    });
  }

  confirmSaveStory = () => {
    var story = this.state.storyToSave;

    // Insert story
    if (this.state.activeAction == MuConstants.STORY_ACTION_ADD) {
      // Send REST request to add the story and update the state
      addStory(story)
        .then(story => this.setState({ stories: this.state.stories.concat(story) }))
        .catch((error) => {
          this.setState({ hasError: true });
        });
    }
    // Replace story
    else if (this.state.activeAction == MuConstants.STORY_ACTION_EDIT) {
      // Send REST request to replace the story and update the state
      replaceStory(story)
        .then(() => {
          // Replace, well, actually remove and concat
          this.setState({ stories: this.state.stories.filter((_story) => { return _story.key != story.key }) })
          this.setState({ stories: this.state.stories.concat(story) })
        })
        .catch((error) => {
          this.setState({ hasError: true });
        });
    }
    this.closeSaveStoryModal();
  }

  onSaveStoryChange = (key, value) => {
    var storyToSave = this.state.storyToSave;
    storyToSave.content[key] = value;
    // Inject the type in the story
    storyToSave.content.type = toStoryType(this.state.activeType);
    this.setState({ storyToSave });
  }

  openDeleteConfirmModal = (storyToDelete) => {
    // Set show state of delete modal to true and remember the storyToDelete
    this.setState({ storyToDelete, showDeleteConfirmModal: true })
  }

  closeDeleteConfirmModal = () => {
    // Set show state of delete modal to false and storyToDelete to null
    this.setState({ storyToDelete: null, showDeleteConfirmModal: false })
  }

  confirmDeleteStory = () => {
    var story = this.state.storyToDelete;

    // Send REST request to delete the story and update the state
    removeStory(story.key)
      .then(
        this.setState(
          { stories: this.state.stories.filter((_story) => { return _story.key != story.key }) }
        )
      )
      .catch((error) => {
        this.setState({ hasError: true });
      });
    this.closeDeleteConfirmModal();
  }

  confirmStoryTypeUpdate = (story, type) => {
    // Update a copy of the story before going to server
    var _story = cloneStory(story);
    _story.content.type = type;

    // Send REST request to replace the story and update the state
    replaceStory(_story)
      .then(() => {
        // Replace, well, actually remove and concat
        this.setState({ stories: this.state.stories.filter((item) => { return item.key != story.key }) })
        this.setState({ stories: this.state.stories.concat(_story) })
      })
      .catch((error) => {
        this.setState({ hasError: true });
      });
  }

  render() {
    const renderRedirect = () => {
      return (<Redirect to="/error500" />);
    }

    return (
      <div className="mu-board ">
        <div className="mu-deadbeef">
          {this.state.hasError &&
            renderRedirect()
          }
        </div>
        <div className="row ">
          <div className="col">
            <MuStoryPane
              isLoading={this.state.isLoading}
              type={MuConstants.STORY_TYPE_TODO}
              stories={this.state.stories}
              openSaveStoryModal={this.openSaveStoryModal}
              openDeleteConfirmModal={this.openDeleteConfirmModal}
              onChangeType={this.confirmStoryTypeUpdate} />
          </div>
          <div className="col">
            <MuStoryPane
              isLoading={this.state.isLoading}
              type={MuConstants.STORY_TYPE_INPROGRESS}
              stories={this.state.stories}
              openSaveStoryModal={this.openSaveStoryModal}
              openDeleteConfirmModal={this.openDeleteConfirmModal}
              onChangeType={this.confirmStoryTypeUpdate} />
          </div>
          <div className="col">
            <MuStoryPane
              isLoading={this.state.isLoading}
              type={MuConstants.STORY_TYPE_COMPLETED}
              stories={this.state.stories}
              openSaveStoryModal={this.openSaveStoryModal}
              openDeleteConfirmModal={this.openDeleteConfirmModal}
              onChangeType={this.confirmStoryTypeUpdate} />
          </div>
          <div id="mu-modals">
            <MuSaveStoryModal
              show={this.state.showSaveStoryModal}
              header={this.state.activeType}
              action={this.state.activeAction}
              story={this.state.storyToSave}
              onChange={this.onSaveStoryChange}
              onConfirm={this.confirmSaveStory}
              onClose={this.closeSaveStoryModal} />
            <MuDeleteConfirmModal
              show={this.state.showDeleteConfirmModal}
              onConfirm={this.confirmDeleteStory}
              onClose={this.closeDeleteConfirmModal} />
          </div>
        </div>
      </div>
    );
  }
}

export default MuBoard;