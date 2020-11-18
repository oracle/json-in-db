import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopyright } from '@fortawesome/free-regular-svg-icons'
import { faCloud, faAward, faEnvelope, faMapMarkerAlt, faPhoneAlt, faDatabase, faBug } from '@fortawesome/free-solid-svg-icons'
import { faGithub, faTwitter, faFacebookF, faYoutube, faInstagram, faNodeJs, faReact, faBootstrap, faFontAwesomeFlag } from '@fortawesome/free-brands-svg-icons'

class MuFooter extends React.Component {
  render() {
    return (
      <footer>
        <div className="container-fluid bg-secondary">
          <div className="row">
            <div className="col">
              <h1 className="text-white  display-4">
                <FontAwesomeIcon icon={faAward} />
                MuSprint
              </h1>
              <p className="text-white">Currently v1.0.0 </p>
              <p className="lead">
                <a target="_blank" href="https://github.com/oracle/json-in-db/tree/master/MuSprint" className="btn btn-secondary text-white">
                  <FontAwesomeIcon icon={faGithub} />
                </a>
                <a href="#" className="btn btn-secondary text-white">
                  <FontAwesomeIcon icon={faFacebookF} />
                </a>
                <a href="#" className="btn btn-secondary text-white">
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
                <a target="_blank" href="https://www.youtube.com/playlist?list=PLPIzp-E1msrbgGQ0H7GhTERnd8WgTuZ6N" className="btn btn-secondary text-white">
                  <FontAwesomeIcon icon={faYoutube} />
                </a>
                <a href="#" className="btn btn-secondary text-white">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
              </p>
              <p className="lead">
                <a target="_blank" href="https://github.com/oracle/json-in-db/issues" className="btn btn-secondary text-white">
                  <FontAwesomeIcon icon={faBug} /> Report Bugs
                </a>
              </p>
            </div>

            <div className="col">
              <table className="table table-borderless text-white">
                <tbody>
                  <tr>
                    <td> <FontAwesomeIcon icon={faPhoneAlt} /> +1 800.111.2222 </td>
                  </tr>
                  <tr>
                    <td> <FontAwesomeIcon icon={faEnvelope} /> example@example.com </td>
                  </tr>
                  <tr>
                    <td> <FontAwesomeIcon icon={faMapMarkerAlt} />  Maitre, California 94065 </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="col">
              <div className="font-weight-bold  text-white-50">
                BUILT AND SERVED BY
              </div>
              <ul className="list-unstyled">
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://www.oracle.com/cloud/">
                    <FontAwesomeIcon icon={faCloud} /> Oracle Cloud Infrastructure
                  </a>
                </li>
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://www.oracle.com/autonomous-database/autonomous-json-database/">
                    <FontAwesomeIcon icon={faDatabase} />
                  Autonomous JSON Database
                  </a>
                </li>
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://docs.oracle.com/en/database/oracle/simple-oracle-document-access/">Simple Oracle Document Access</a>
                </li>
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://expressjs.com/">Express.js</a>
                </li>
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://reactjs.org/">
                    <FontAwesomeIcon icon={faReact} />
                    React.js
                  </a>
                </li>
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://nodejs.org/">
                    <FontAwesomeIcon icon={faNodeJs} />
                    Node.js
                  </a>
                </li>
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://getbootstrap.com/">
                    <FontAwesomeIcon icon={faBootstrap} />
                    Bootstrap
                  </a>
                </li>
                <li>
                  <a className="btn btn-secondary text-decoration-none" target="_blank" href="https://fontawesome.com/">
                    <FontAwesomeIcon icon={faFontAwesomeFlag} />
                    Font Awesome
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>
        <div className="container-fluid bg-light">
          <p className="float-center">
            Copyright <FontAwesomeIcon icon={faCopyright} /> 2020, Oracle and/or its affiliates
            </p>
        </div>
      </footer>
    );
  }
}

export default MuFooter;
