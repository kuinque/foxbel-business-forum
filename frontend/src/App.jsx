import { useState, useEffect } from 'react';
import { authTelegram, getProfile, getToken, clearToken, checkAdmin } from './api';
import Profile from './components/Profile';
import Scanner from './components/Scanner';
import Leaderboard from './components/Leaderboard';
import Admin from './components/Admin';
import Shop from './components/Shop';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      
      if (tg) {
        tg.ready();
        tg.expand();
        
        // Применяем тему Telegram
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f1f1f1');
      }

      // Проверяем существующий токен
      if (getToken()) {
        try {
          const profile = await getProfile();
          setUser(profile);
          const adminStatus = await checkAdmin();
          setIsAdmin(adminStatus);
          setLoading(false);
          return;
        } catch (e) {
          clearToken();
        }
      }

      // Авторизуемся через Telegram
      if (tg?.initData) {
        const authData = await authTelegram(tg.initData);
        setUser(authData.user);
        const adminStatus = await checkAdmin();
        setIsAdmin(adminStatus);
      } else {
        setError('Откройте приложение через Telegram');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async () => {
    // Обновляем профиль после сканирования
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  const handlePurchase = (newBalance) => {
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="message message-error">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="message message-error">Не удалось авторизоваться</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav">
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
        <button 
          className={`nav-btn ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          Скан
        </button>
        <button 
          className={`nav-btn ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          Магазин
        </button>
        <button 
          className={`nav-btn ${activeTab === 'leaders' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaders')}
        >
          Топ
        </button>
        {isAdmin && (
          <button 
            className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Админ
          </button>
        )}
      </div>

      {activeTab === 'profile' && <Profile user={user} />}
      {activeTab === 'scan' && <Scanner onSuccess={handleScanSuccess} />}
      {activeTab === 'shop' && <Shop userBalance={user.balance} onPurchase={handlePurchase} />}
      {activeTab === 'leaders' && <Leaderboard />}
      {activeTab === 'admin' && isAdmin && <Admin />}
    </div>
  );
}

export default App;
