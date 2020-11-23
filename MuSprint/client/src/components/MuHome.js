import React from 'react';
import Carousel from 'react-bootstrap/Carousel'
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faArrowCircleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import slide1 from '../img/board-1.png'
import slide2 from '../img/board-2.png'
import slide3 from '../img/board-3.png'
import slide4 from '../img/board-4.png'

class MuHome extends React.Component {
  render() {
    const renderCarousel = () => {
      return (
        <Carousel>
          <Carousel.Item interval={2000}>
            <img className="d-block w-100" src={slide1} />
          </Carousel.Item>
          <Carousel.Item interval={2000}>
            <img className="d-block w-100" src={slide2} />
          </Carousel.Item>
          <Carousel.Item interval={2000}>
            <img className="d-block w-100" src={slide3} />
          </Carousel.Item>
          <Carousel.Item interval={2000}>
            <img className="d-block w-100" src={slide4} />
          </Carousel.Item>
        </Carousel>
      );
    }
    return (
      <div className="mu-home container-fluid bg-white">
        <div className="mu-home-row row justify-content-center">
          <h1 className="display-4">Be the Sprint Champion</h1>
        </div>
        <div className="mu-home-row row justify-content-center">
          <p className="lead">Track and manage sprint user stories in story boards.</p>
        </div>
        <div className="mu-home-row row justify-content-center">
          <div className="col-md-6">
          {renderCarousel()}
          </div>
        </div>
        <div className="mu-home-row row justify-content-center">
          <a target="_blank" href="https://github.com/oracle/json-in-db/tree/master/MuSprint" className="mu-btn-jumbo btn btn-outline-secondary btn-lg">
            View Source
            <FontAwesomeIcon icon={faGithub} style={{ marginLeft: '0.4em' }} />
          </a>
          <a href="/stories" className="mu-btn-jumbo btn btn-primary btn-lg">
            Story Board
            <FontAwesomeIcon icon={faArrowCircleRight} style={{ marginLeft: '0.4em' }} />
          </a>
        </div>
      </div>
    );
  }
}

export default MuHome;