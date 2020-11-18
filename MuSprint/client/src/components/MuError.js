import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

class MuError extends React.Component {
  render() {
    return (
      <div className="mu-error container-fluid bg-light text-center">
        <h1 className="display-1" style={{ fontSize: '8rem' }}>
          <FontAwesomeIcon icon={faExclamationCircle} />
        </h1>
        <br />
        <h2>
          {
            this.props.code == 404 &&
            <span>Page Not Found.</span>
          }
          {
            this.props.code == 500 &&
            <span>Oops, something went wrong.</span>
          }
        </h2>
        <br />
        <blockquote className="blockquote">
          {
            this.props.code == 404 &&
            <span>We couldn't find what you were looking for.</span>
          }
          {
            this.props.code == 500 &&
            <span>Try the last action again or feel free to contact us if the problem exists.</span>
          }
        </blockquote>
        <br />
      </div>
    );
  }
}

export default MuError;