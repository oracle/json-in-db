import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

class MuDeleteConfirmModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
    }
  };

  render() {
    return (
      <Modal show={this.props.show} onHide={this.props.onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Story</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete the story? This action cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.props.onClose}>
            Discard
          </Button>
          <Button variant="danger" onClick={this.props.onConfirm}>
            Yes, Delete!
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default MuDeleteConfirmModal;