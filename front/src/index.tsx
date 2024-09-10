import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux';
import App from './app'
import  "./global.css"
import Profile from './app'
import { setupStore } from './store/store';
import 
{Route,BrowserRouter as Router,Routes,
    createBrowserRouter,
    RouterProvider,
  } from "react-router-dom";

if (module && module.hot) {
    module.hot.accept();
}

const store = setupStore()

ReactDOM.render(
    <Provider store={store}>
             <App />
        </Provider>,


    document.querySelector('#root')
);