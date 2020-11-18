import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAward, faCog, faHome, faUser } from '@fortawesome/free-solid-svg-icons'

class MuHeader extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <a className="navbar-brand btn btn-dark" href="#">
          <FontAwesomeIcon icon={faAward} />
          <b>MuSprint</b>
        </a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto"> </ul>
          <div className="">
            <a href="/home" role="button" className="btn text-white bg-dark">
              <FontAwesomeIcon icon={faHome} />
            </a>
            <a href="#" role="button" className="btn text-white bg-dark">
              <FontAwesomeIcon icon={faUser} />
            </a>
            <a href="#" role="button" className="btn text-white bg-dark">
              <FontAwesomeIcon icon={faCog} />
            </a>
          </div>
        </div>
      </nav>
    );
  }
}

export default MuHeader;
