import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckDouble, faExclamation, faEye, faNewspaper, faPenAlt, faPlusCircle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

import { toDecorType2 } from '../utils/mutils'
import * as MuConstants from '../exports/MuConstants'

class MuSaveStoryModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      jsonTab: false,
      titleValidity: '',
      pointsValidity: '',
      descriptionValidity: ''
    }
  };

  onStoryTab = () => {
    this.setState({ jsonTab: false })
  }

  onJsonTab = () => {
    this.setState({ jsonTab: true })
  }

  onClose = () => {
    // Reset the state so it doesn't get sticky
    this.setState({ jsonTab: false, titleValidity: '', pointsValidity: '', descriptionValidity: '' })
    this.props.onClose();
  }

  isValidValue = (key, value) => {
    var isValid = true;

    if (key == MuConstants.STORY_FIELD_TITLE) {
      isValid = (value != null && value != '');
      this.setState({ titleValidity: isValid ? 'is-valid' : 'is-invalid' });
    }
    else if (key == MuConstants.STORY_FIELD_DESCRIPTION) {
      isValid = (value != null && value != '');
      this.setState({ descriptionValidity: isValid ? 'is-valid' : 'is-invalid' });
    }
    else if (key == MuConstants.STORY_FIELD_POINTS) {
      value = Number.parseInt(value);
      isValid = (Number.isInteger(value) && value > 0);
      this.setState({ pointsValidity: isValid ? 'is-valid' : 'is-invalid' });
    }
    return isValid;
  }

  onFormChange = (field, event) => {
    var value = event.target.value;
    this.isValidValue(field, value);
    if (field == MuConstants.STORY_FIELD_POINTS)
      value = Number.parseInt(value);
    this.props.onChange(field, value);
  }

  isValidForm = () => {
    var isValid;
    // Scan fields to be validate
    isValid = 
      this.isValidValue(MuConstants.STORY_FIELD_TITLE, this.props.story.content.title) &&
      this.isValidValue(MuConstants.STORY_FIELD_POINTS, this.props.story.content.points) &&
      this.isValidValue(MuConstants.STORY_FIELD_DESCRIPTION, this.props.story.content.description);
    return isValid;
  }

  onFormSubmit = () => {
    if (this.isValidForm()) {
      this.props.onConfirm();
      // Reset the state so it doesn't get sticky
      this.setState({ jsonTab: false, titleValidity: '', pointsValidity: '', descriptionValidity: '' })
    }
  }

  render() {

    const renderStorySaveForm = () => {
      return (
        <div className={`mu-story border border-${toDecorType2(this.props.header)} bg-white`}
          style={{ padding: '20px' }}>
          <Form noValidate>
            <Form.Row>
              <Col>
                <Form.Label><strong>Title</strong></Form.Label>
                <Form.Control type="text" placeholder="Enter story title"
                  className={this.state.titleValidity}
                  readOnly={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  plaintext={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  defaultValue={this.props.story.content.title}
                  onChange={this.onFormChange.bind(this, 'title')} />
                <Form.Control.Feedback type="invalid">
                  Please enter story title.
                </Form.Control.Feedback>
              </Col>
              <Col xs={3}>
                <Form.Label><strong>Story Points</strong></Form.Label>
                <Form.Control type="text" placeholder="Points"
                  className={this.state.pointsValidity}
                  readOnly={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  plaintext={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  defaultValue={this.props.story.content.points}
                  onChange={this.onFormChange.bind(this, 'points')} />
                <Form.Control.Feedback type="invalid">
                  Invalid integer.
                </Form.Control.Feedback>
              </Col>
            </Form.Row>
            <br />
            <Form.Row>
              <Col>
                <Form.Label><strong>Subtitle</strong></Form.Label>
                <Form.Control type="text" placeholder="Enter story subtitle (optional)"
                  readOnly={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  plaintext={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  defaultValue={this.props.story.content.subtitle}
                  onChange={this.onFormChange.bind(this, 'subtitle')} />
              </Col>
            </Form.Row>
            <br />
            <Form.Row>
              <Col>
                <Form.Label><strong>Description</strong></Form.Label>
                <Form.Control as="textarea" placeholder="Description of the story goes here..."
                  className={this.state.descriptionValidity}
                  readOnly={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  plaintext={this.props.action == MuConstants.STORY_ACTION_VIEW ? true : null}
                  defaultValue={this.props.story.content.description} rows={5}
                  onChange={this.onFormChange.bind(this, 'description')} />
                <Form.Control.Feedback type="invalid">
                  Please enter story description.
                </Form.Control.Feedback>
              </Col>
            </Form.Row>
          </Form>
        </div>
      )
    }

    const renderStoryIcon = () => {
      // Choose header icon based on the type
      if (this.props.header == MuConstants.STORY_HEADER_TODO)
        return <FontAwesomeIcon icon={faExclamation} />
      else if (this.props.header == MuConstants.STORY_HEADER_INPROGRESS)
        return <FontAwesomeIcon icon={faSyncAlt} />
      else if (this.props.header == MuConstants.STORY_HEADER_COMPLETED)
        return <FontAwesomeIcon icon={faCheckDouble} />
    }

    const renderStoryCard = () => {
      return (
        <div className={`mu-story border border-${toDecorType2(this.props.header)} bg-white`}
          style={{ padding: '20px' }}>
          <span className={`badge badge-${toDecorType2(this.props.header)} float-right`}>
            {this.props.story.content.points}
          </span>
          <h5>{renderStoryIcon()}{this.props.story.content.title}</h5> <hr />
          <blockquote className="blockquote"> {this.props.story.content.subtitle} </blockquote>
          <p className="lead">{this.props.story.content.description}</p>
        </div>
      )
    }

    const renderHeaderIcon = () => {
      // Choose header icon based on the type
      if (this.props.action == MuConstants.STORY_ACTION_ADD)
        return <FontAwesomeIcon icon={faPlusCircle} />
      else if (this.props.action == MuConstants.STORY_ACTION_EDIT)
        return <FontAwesomeIcon icon={faPenAlt} />
      else if (this.props.action == MuConstants.STORY_ACTION_VIEW)
        return <FontAwesomeIcon icon={faEye} />
    }

    const renderModalTitle = () => {
      return (
        <Modal.Title>
          <span className={`badge badge-${toDecorType2(this.props.header)} float-right`}>
            {renderHeaderIcon()} {this.props.header}
          </span>
        </Modal.Title>
      )
    }

    const renderJsonStory = () => {
      return (
        <div className="border bg-light"
          style={{ borderRadius: '5px', padding: '10px' }}>
          <pre className="text-dark">
            <code>
              {JSON.stringify(this.props.story, null, 2)}
            </code>
          </pre>
        </div>
      )
    }

    return (
      <Modal show={this.props.show} onHide={this.onClose} scrollable={true}>
        <Modal.Header closeButton variant="danger">
          {renderModalTitle()}
        </Modal.Header>
        <Modal.Body>
          <Nav variant="tabs" defaultActiveKey="story">
            <Nav.Item>
              <Nav.Link eventKey="story" onClick={this.onStoryTab}>
                <FontAwesomeIcon icon={faNewspaper} />
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="json" onClick={this.onJsonTab}>
                &#123; &#125;
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <br />
          {
            !this.state.jsonTab
              ? (this.props.action != MuConstants.STORY_ACTION_VIEW
                ? renderStorySaveForm()
                : renderStoryCard())
              : (renderJsonStory())
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.onClose}>
            Discard
          </Button>
          {
            this.props.action != MuConstants.STORY_ACTION_VIEW &&
            <Button variant="primary" onClick={this.onFormSubmit}>
              Save
            </Button>
          }
        </Modal.Footer>
      </Modal>
    );
  }
}

export default MuSaveStoryModal;