import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenAlt, faTrashAlt, faExclamation, faCheckDouble, faSyncAlt, faSignInAlt } from '@fortawesome/free-solid-svg-icons';

import Dropdown from 'react-bootstrap/Dropdown'

import * as MuConstants from '../exports/MuConstants'

class MuStory extends Component {

  constructor(props) {
    super(props);
    this.state = {
      content: props.story.content,
      cursor: 'default',
      showToolbar : false
    }
  };

  onStoryOver = () => {
    this.setState({ cursor: 'pointer', showToolbar: true })
  }

  onStoryLeave = () => {
    this.setState({ cursor: 'default', showToolbar: false })
  }

  onChangeType = (event) => {
    event.stopPropagation();
  }
  render() {
    return (
      <div className={`mu-story card shadow border-${this.props.decor}`}
        style={{ cursor: this.state.cursor, border: this.state.storyBorder }}
        onMouseOver={this.onStoryOver}
        onMouseLeave={this.onStoryLeave}
        onClick={this.props.onView.bind(null, this.props.header, this.props.story, MuConstants.STORY_ACTION_VIEW)}>
        <div className="card-body">
          <span className={`badge badge-${this.props.decor} float-right`}>
            {this.state.content.points}
          </span>
          <h5 className="card-title">{this.state.content.title}</h5>
          <h6 className="card-subtitle mb-2 text-muted">{this.state.content.subtitle}</h6>
          <p className="card-text">{this.state.content.description}</p>
        </div>
        { this.state.showToolbar &&
          <div className="mu-story-tollbar card-footer">
            <div className="btn-group">
              <button className="btn btn-link card-link"
                onClick={this.props.onEdit.bind(null, this.props.story)}>
                <FontAwesomeIcon icon={faPenAlt} />
              </button>
              <Dropdown className="float-right" onClick={this.onChangeType.bind(this)}>
                <Dropdown.Toggle id="dropdown-basic" variant="link">
                  <FontAwesomeIcon icon={faSignInAlt} />
                </Dropdown.Toggle>
                {
                  this.state.content.type == MuConstants.STORY_TYPE_TODO
                  ?
                  <Dropdown.Menu>
                      <Dropdown.Item href="#"
                        onClick={this.props.onChangeType.bind(null, this.props.story, 'in-progress')}>
                        <FontAwesomeIcon icon={faSyncAlt} />In Progress
                      </Dropdown.Item>
                      <Dropdown.Item href="#"
                        onClick={this.props.onChangeType.bind(null, this.props.story, 'completed')}>
                        <FontAwesomeIcon icon={faCheckDouble} />Completed
                      </Dropdown.Item>
                  </Dropdown.Menu>
                  :
                  this.state.content.type == MuConstants.STORY_TYPE_INPROGRESS
                  ?
                  <Dropdown.Menu>
                    <Dropdown.Item href="#"
                      onClick={this.props.onChangeType.bind(null, this.props.story, 'todo')}>
                      <FontAwesomeIcon icon={faExclamation} />To Do
                    </Dropdown.Item>
                    <Dropdown.Item href="#"
                      onClick={this.props.onChangeType.bind(null, this.props.story, 'completed')}>
                      <FontAwesomeIcon icon={faCheckDouble} />Completed
                    </Dropdown.Item>
                  </Dropdown.Menu>
                  :
                  <Dropdown.Menu>
                    <Dropdown.Item href="#"
                      onClick={this.props.onChangeType.bind(null, this.props.story, 'todo')}>
                      <FontAwesomeIcon icon={faExclamation} />To Do
                    </Dropdown.Item>
                    <Dropdown.Item href="#"
                      onClick={this.props.onChangeType.bind(null, this.props.story, 'in-progress')}>
                      <FontAwesomeIcon icon={faSyncAlt} />In Progress
                    </Dropdown.Item>
                  </Dropdown.Menu>
                }
              </Dropdown>
              <button className="btn btn-link card-link text-danger"
                onClick={this.props.onRemove.bind(null, this.props.story)}>
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </div>
          </div>
        }
      </div>
    );
  }
}

export default MuStory;