import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckDouble, faExclamation, faPlusCircle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

import * as MuConstants from '../exports/MuConstants'
import { toHeaderType, toDecorType } from '../utils/mutils'
import MuStory from './MuStory';

class MuStoriesPane extends Component {
  constructor(props) {
    // Initialize the state of the story pane
    super(props);
    this.state = {
      decor: null,
      header: null
    };
    this.state.header = toHeaderType(this.props.type);
    this.state.decor = toDecorType(this.props.type);
  }

  onAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.openSaveStoryModal(this.state.header, null, MuConstants.STORY_ACTION_ADD);
  }

  onEdit = (story, event) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.openSaveStoryModal(this.state.header, story, MuConstants.STORY_ACTION_EDIT);
  }

  onRemove = (story, event) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.openDeleteConfirmModal(story);
  }

  onChangeType = (story, type) => {
    this.props.onChangeType(story, type);
  }

  render() {
    const renderHeaderIcon = () => {
      // Choose header icon based on the type
      if (this.props.type == MuConstants.STORY_TYPE_TODO)
        return <FontAwesomeIcon icon={faExclamation} />
      else if (this.props.type == MuConstants.STORY_TYPE_INPROGRESS)
        return <FontAwesomeIcon icon={faSyncAlt} />
      else if (this.props.type == MuConstants.STORY_TYPE_COMPLETED)
        return <FontAwesomeIcon icon={faCheckDouble} />
    }

    return (
      <div className={`mu-story-pane card border-${this.state.decor}`}>
        <div className="card-header">
          {this.props.isLoading &&
            <div className="spinner-border float-right" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          }
          <h4>{renderHeaderIcon()}{this.state.header}</h4>
        </div>
        <div className="card-body overflow-auto">
          {
            // Render each of the stories in the list after filtering by type
            this.props.stories
              .filter(story => story.content.type == this.props.type)
              .map(story =>
                <div key={story.key}>
                  <MuStory
                    decor={this.state.decor}
                    story={story}
                    header={this.state.header}
                    onView={this.props.openSaveStoryModal}
                    onEdit={this.onEdit.bind(this)}
                    onRemove={this.onRemove.bind(this)}
                    onChangeType={this.onChangeType.bind(this)} />
                  <br />
                </div>
              )
          }
        </div>
        <div className="card-footer">
          <a href="#" className="card-link" onClick={this.onAdd.bind(this)}>
            <FontAwesomeIcon icon={faPlusCircle} />
          </a>
        </div>
      </div>
    );
  }
}

export default MuStoriesPane;