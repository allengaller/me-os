import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import ToastContainer from './components/Toast';
import { applyTheme, getTheme } from './lib/theme';
import { useAuthStore } from './stores/authStore';
import './index.css';

applyTheme(getTheme());

const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage;
const useLocalMode = isChromeExtension || import.meta.env.VITE_USE_LOCAL === '1';
const Router = useLocalMode ? HashRouter : BrowserRouter;

// 整页刷新后恢复 localDB 内存态（当前用户），否则本地模式数据读取为空
useAuthStore.getState().initFromStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
      <ToastContainer />
    </Router>
  </React.StrictMode>
);
