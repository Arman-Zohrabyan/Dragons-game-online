import React, { Component, Fragment } from 'react';
import { socketConnect } from 'socket.io-react';
import Dragons from "./dragons.js";


class Connect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      connected: false
    }
  }

  componentDidMount() {
    this.props.socket.on('connect', () => {
      this.setState({connected: true});
    });
  }

  render() {
    return (
      <Fragment>
        {
          this.state.connected ? <Dragons /> : <div className="loading"></div>
        }
      </Fragment>
    );
  }
}


export default socketConnect(Connect);