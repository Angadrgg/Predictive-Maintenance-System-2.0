// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App.jsx';
import Dashboard from './components/Dashboard.jsx';
import MachinesPage from './components/MachinesPage.jsx';
import AlertsPage from './components/AlertsPage.jsx';
import ReportsPage from './components/ReportsPage.jsx';

import './index.css';

// 1. Define your routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App is the main layout (with sidebar)
    children: [
      {
        path: '/', // The default page (index)
        element: <Dashboard />,
      },
      {
        path: '/machines',
        element: <MachinesPage />,
      },
      {
        path: '/alerts',
        element: <AlertsPage />,
      },
      {
        path: '/reports',
        element: <ReportsPage />,
      },
    ],
  },
]);

// 2. Provide the router to your app
ReactDOM.createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
  
);