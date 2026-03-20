import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api';

function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const result = await getLeaderboard(10);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getDisplayName = (item) => {
    if (item.first_name) return item.first_name;
    if (item.username) return `@${item.username}`;
    return 'Аноним';
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="message message-error">{error}</div>;
  }

  return (
    <div>
      <div className="section-title">Таблица лидеров</div>

      {data.current_user_rank && (
        <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
            Ваша позиция
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--tg-theme-button-color)' }}>
            #{data.current_user_rank}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
            из {data.total_users} участников
          </div>
        </div>
      )}

      {data.leaders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)' }}>
          Пока нет участников с баллами
        </div>
      ) : (
        <div className="card">
          {data.leaders.map((item) => (
            <div 
              key={item.rank} 
              className="history-item"
              style={{
                background: item.is_current_user ? 'var(--tg-theme-button-color)10' : 'transparent',
                margin: item.is_current_user ? '-12px' : '0',
                padding: item.is_current_user ? '12px' : '12px 0',
                borderRadius: item.is_current_user ? '8px' : '0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '32px', 
                  textAlign: 'center',
                  fontSize: item.rank <= 3 ? '20px' : '16px',
                  fontWeight: '600',
                }}>
                  {getMedal(item.rank)}
                </div>
                <div>
                  <div style={{ fontWeight: item.is_current_user ? '600' : '500' }}>
                    {getDisplayName(item)}
                    {item.is_current_user && ' (вы)'}
                  </div>
                </div>
              </div>
              <div style={{ 
                fontWeight: '600', 
                color: 'var(--tg-theme-button-color)',
              }}>
                {item.balance}
              </div>
            </div>
          ))}
        </div>
      )}

      <button 
        className="btn btn-secondary" 
        onClick={loadLeaderboard}
        style={{ marginTop: '16px' }}
      >
        Обновить
      </button>
    </div>
  );
}

export default Leaderboard;
