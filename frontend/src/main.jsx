// // Entry point — mounts the App component into the DOM
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.jsx'
// import './styles/global.css'
// import axios from "axios";

// // 🔥 ADD THESE
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// axios.defaults.baseURL = "http://localhost:5000";
// axios.defaults.withCredentials = true;

// // 🔥 Fires when any API call returns 401
// axios.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) {
//       toast.error("Session expired. Please login again.", {
//         position: "top-center",
//         autoClose: 2000,
//       });

//       setTimeout(() => {
//         window.location.href = "/login";
//       }, 2000);
//     }
//     return Promise.reject(error);
//   }
// );

// // 🔥 Idle detection
// const IDLE_TIMEOUT = 10 * 1000;
// let idleTimer;

// const resetIdleTimer = () => {
//   clearTimeout(idleTimer);
//   idleTimer = setTimeout(async () => {
//     try {
//       await axios.get("/api/check-session");
//     } catch {
//       // interceptor handles redirect
//     }
//   }, IDLE_TIMEOUT);
// };

// ["mousemove", "keydown", "click", "scroll"].forEach(event =>
//   window.addEventListener(event, resetIdleTimer)
// );

// resetIdleTimer();

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//     <ToastContainer /> {/* 🔥 VERY IMPORTANT */}
//   </React.StrictMode>
// );

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

import axios from "axios"

// toast
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

axios.defaults.baseURL = "http://localhost:5000"
axios.defaults.withCredentials = true

// 🔥 interceptor for session expiry
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {

      toast.error("Session expired. Please login again.")

      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)

    }

    return Promise.reject(error)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer position="top-center" autoClose={2000} />
  </React.StrictMode>
)