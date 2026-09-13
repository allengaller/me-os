import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ToastContainer from './components/Toast';
import { applyTheme, getTheme } from './lib/theme';
import { useAuthStore } from './stores/authStore';
import './index.css';

applyTheme(getTheme());

// 整页刷新后恢复 localDB 内存态（当前用户），否则 chrome 扩展场景数据读取为空
useAuthStore.getState().initFromStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
      <ToastContainer />
    </HashRouter>
  </React.StrictMode>
);
