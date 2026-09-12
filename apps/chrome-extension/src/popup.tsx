import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

interface QuickStats {
  todosToday: number;
  goalsActive: number;
  reflectionStreak: number;
}

const MEOS_APP_URLS = ['http://localhost:3000', 'http://localhost:5173', 'https://meos.app'];
const API_BASE = 'http://localhost:3001/api';

export default function Popup() {
  const [stats, setStats] = useState<QuickStats>({
    todosToday: 0,
    goalsActive: 0,
    reflectionStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todoTitle, setTodoTitle] = useState('');
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage.local.get(['meos_stats'], (result) => {
      if (result.meos_stats) {
        setStats(result.meos_stats);
      }
      setLoading(false);
    });
  }, []);

  const openMeOS = () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  };

  const getToken = (cb: (token: string | null) => void) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url && MEOS_APP_URLS.some((u) => tab.url.startsWith(u))) {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_MEOS_TOKEN' }, (res) => {
          if (res && res.token) return cb(res.token);
          cb(null);
        });
        return;
      }
      chrome.storage.local.get(['meos_token'], (result) => cb(result.meos_token || null));
    });
  };

  const createTodo = (title: string) => {
    setStatus({ message: '添加中…', isError: false });
    getToken((token) => {
      if (!token) {
        setStatus({ message: '未登录：先打开一次 MeOS 页面（localhost:3000）再试', isError: true });
        return;
      }
      fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, source: 'extension' }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setStatus({ message: '已添加 ✓', isError: false });
          setTodoTitle('');
        })
        .catch(() => {
          setStatus({ message: '添加失败，请确认后端已启动（localhost:3001）', isError: true });
        });
    });
  };

  const handleAdd = () => {
    const title = todoTitle.trim();
    if (!title) {
      inputRef.current?.focus();
      return;
    }
    createTodo(title);
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>MeOS</h1>
        <span className="subtitle">人生管理系统</span>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.todosToday}</div>
          <div className="stat-label">今日待办</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.goalsActive}</div>
          <div className="stat-label">进行中目标</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.reflectionStreak}</div>
          <div className="stat-label">反思连续天数</div>
        </div>
      </div>

      <div className="quick-add">
        <input
          ref={inputRef}
          type="text"
          value={todoTitle}
          onChange={(e) => setTodoTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="直接输入待办，回车添加"
        />
        <div className={`todo-status${status?.isError ? ' error' : ''}`}>{status?.message ?? ''}</div>
      </div>

      <div className="actions">
        <button onClick={openMeOS} className="btn btn-primary">
          打开 MeOS
        </button>
        <button onClick={handleAdd} className="btn btn-secondary">
          添加待办
        </button>
      </div>

      <footer className="popup-footer">
        <span>v0.1.0</span>
      </footer>

      <style>{`
        .popup-container {
          width: 320px;
          padding: 16px;
          background: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .popup-header {
          text-align: center;
          margin-bottom: 16px;
        }
        .popup-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }
        .subtitle {
          font-size: 12px;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #4f46e5;
        }
        .stat-label {
          font-size: 10px;
          color: #888;
          margin-top: 4px;
        }
        .actions {
          display: flex;
          gap: 8px;
        }
        .quick-add {
          margin: 12px 0;
        }
        .quick-add input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }
        .quick-add input:focus {
          border-color: #4f46e5;
        }
        .todo-status {
          margin-top: 6px;
          font-size: 12px;
          color: #10b981;
          min-height: 16px;
        }
        .todo-status.error {
          color: #ef4444;
        }
        .btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #4f46e5;
          color: white;
        }
        .btn-primary:hover {
          background: #4338ca;
        }
        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }
        .btn-secondary:hover {
          background: #d1d5db;
        }
        .popup-footer {
          margin-top: 16px;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}