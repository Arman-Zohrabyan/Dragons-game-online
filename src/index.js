import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { Helmet } from "react-helmet";

import { SocketProvider } from 'socket.io-react';
import io from 'socket.io-client';

import Connect from "./connect.js";


let livereload = null;
if(process.env.NODE_ENV === 'development') {
  livereload = <Helmet><script src="http://localhost:35729/livereload.js"></script></Helmet>;
}

const socket = io();

ReactDOM.render(
  <SocketProvider socket={socket}>
    <Connect />
    {livereload}
  </SocketProvider>, document.getElementById('root')
);
