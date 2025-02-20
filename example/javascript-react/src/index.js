import 'es6-shim';
import 'whatwg-fetch';
import Symbol from 'es-symbol';
import $ from 'jquery';
import {BrowserRouter as Router, Redirect, Route, Switch} from 'react-router-dom';
import * as Service from './services';
import {Api as IzanamiApi, IzanamiProvider} from 'react-izanami';
import './styles.scss'
import React from 'react';
import ReactDOM from 'react-dom';
import MyTvShows from './pages/MyTvshows';
import TvShow from './pages/TvShow';
import Login from './pages/Login';

if (!window.Symbol) {
  window.Symbol = Symbol;
}
window.$ = $;
window.jQuery = $;

require('bootstrap/dist/js/bootstrap.min');

Array.prototype.flatMap = function (lambda) {
  return Array.prototype.concat.apply([], this.map(lambda));
};


class PrivateRoute extends React.Component {

  state = {
    loaded: false,
    user: null
  };

  componentDidMount() {
    Service.me().then(this.onUserChange);
    Service.onUserChange(this.onUserChange);
  }

  componentWillUnmount() {
    Service.unregister(this.onUserChange);
  }

  onUserChange = user => {
    this.setState({
      loaded: true,
      user
    })
  };

  componentDidUpdate(nextProps) {
    // will be true
    const locationChanged = nextProps.location !== this.props.location;
    if (locationChanged) {
      //Reload izanami data on route change
      console.log("Izanami reload")
      IzanamiApi.izanamiReload("/api/izanami");
    }
  }

  render() {
    if (this.state.loaded) {
      const {component: Component, ...rest} = this.props;
      return (
        <Route {...rest} render={props => {
          return (
            this.state.user ? (
              <Component user={this.state.user} rootPath={this.props.rootPath}/>
            ) : (
              <Redirect to={{
                pathname: '/login',
                state: {from: this.props.location}
              }}/>
            )
          )
        }}/>
      );
    } else {
      return <div/>
    }

  }
}

const withprops = (Component, props, props2) => {
  return <Component {...props} {...props2} />
}

class MainApp extends React.PureComponent {
  render() {
    return (
      <Switch>
        <Route exact path="/" component={p => withprops(MyTvShows, this.props, p)}/>
        <Route path="/tvshow/:id" component={p => withprops(TvShow, this.props, p)}/>
      </Switch>
    );
  }
}

class IzanamiApp extends React.PureComponent {
  render() {
    return (<IzanamiProvider id="mytvshows" fetchFrom={() =>
      fetch("/api/izanami", {
        method: 'GET',
        credentials: 'include'
      })
    }>
      <Router basename="/">
        <Switch>
          <Route path="/login" component={Login} rootPath={this.props.rootPath}/>
          <PrivateRoute path="/" component={MainApp} rootPath={this.props.rootPath}/>
        </Switch>
      </Router>
    </IzanamiProvider>)
  }
}

window._basePath = window.__rootPath || "/assets";

export function init(node, rootPath) {
  ReactDOM.render(<IzanamiApp rootPath={rootPath || '/assets/'}/>, node);
}