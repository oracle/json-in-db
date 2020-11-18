import MuBoard from './MuBoard';
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import MuHome from './MuHome'
import MuError from './MuError';

class MuBody extends React.Component {
  render() {
    return (
      <div className="mu-body container-fluid bg-light">
        <Switch>
          <Route path="/" exact component={MuHome} />
          <Route path="/home" exact component={MuHome} />
          <Route path="/stories" exact component={MuBoard} />
          <Route path="/error500" render={(props) => (<MuError {...props} code={500} />)} />
          <Route render={(props) => (<MuError {...props} code={404} />)} />
        </Switch>
      </div>
    );
  }
}

export default MuBody;