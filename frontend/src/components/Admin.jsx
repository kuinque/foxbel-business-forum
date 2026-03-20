import { useState, useEffect } from 'react';
import { getLocations, createLocation, generateQR } from '../api';

function Admin() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', description: '', points: 10 });
  const [generatedQR, setGeneratedQR] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const location = await createLocation(
        newLocation.name,
        newLocation.description,
        newLocation.points
      );
      setLocations([location, ...locations]);
      setNewLocation({ name: '', description: '', points: 10 });
      setShowCreateForm(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateQR = async (locationId) => {
    try {
      const qr = await generateQR(locationId);
      setGeneratedQR(qr);
    } catch (e) {
      setError(e.message);
    }
  };

  const copyToken = () => {
    if (generatedQR) {
      navigator.clipboard.writeText(generatedQR.token);
      alert('Токен скопирован!');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div>
      <div className="section-title">Управление точками</div>

      {error && (
        <div className="message message-error">{error}</div>
      )}

      {generatedQR && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '12px', fontWeight: '600' }}>
            QR-код сгенерирован
          </div>
          <img 
            src={`/api/v1/admin/qr/${generatedQR.token}/image`} 
            alt="QR Code"
            style={{ maxWidth: '200px', borderRadius: '8px' }}
          />
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
            Действителен до: {new Date(generatedQR.expires_at).toLocaleString('ru-RU')}
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={copyToken} style={{ flex: 1 }}>
              Копировать токен
            </button>
            <button className="btn btn-secondary" onClick={() => setGeneratedQR(null)} style={{ flex: 1 }}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {!showCreateForm ? (
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateForm(true)}
          style={{ marginBottom: '16px' }}
        >
          + Добавить точку
        </button>
      ) : (
        <div className="card">
          <form onSubmit={handleCreateLocation}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Название
              </label>
              <input
                type="text"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--tg-theme-hint-color)',
                  fontSize: '16px',
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Описание
              </label>
              <input
                type="text"
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--tg-theme-hint-color)',
                  fontSize: '16px',
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Баллов за посещение
              </label>
              <input
                type="number"
                value={newLocation.points}
                onChange={(e) => setNewLocation({ ...newLocation, points: parseInt(e.target.value) || 0 })}
                min="1"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--tg-theme-hint-color)',
                  fontSize: '16px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={creating} style={{ flex: 1 }}>
                {creating ? 'Создание...' : 'Создать'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowCreateForm(false)}
                style={{ flex: 1 }}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)' }}>
          Точек пока нет
        </div>
      ) : (
        <div>
          {locations.map((location) => (
            <div key={location.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{location.name}</div>
                  {location.description && (
                    <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>
                      {location.description}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>
                    <span style={{ color: 'var(--tg-theme-button-color)', fontWeight: '600' }}>
                      +{location.points_reward}
                    </span> баллов
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleGenerateQR(location.id)}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
                >
                  QR-код
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;
