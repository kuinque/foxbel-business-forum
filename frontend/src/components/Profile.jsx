function Profile({ user }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = () => {
    if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <div>
      <div className="user-info">
        <div className="user-avatar">{getInitials()}</div>
        <div>
          <div className="user-name">
            {user.first_name} {user.last_name}
          </div>
          {user.username && (
            <div className="user-username">@{user.username}</div>
          )}
        </div>
      </div>

      <div className="card balance-card">
        <div className="balance-value">{user.balance}</div>
        <div className="balance-label">баллов</div>
      </div>

      {user.history && user.history.length > 0 && (
        <div>
          <div className="section-title">История начислений</div>
          <div className="card">
            {user.history.map((item) => (
              <div key={item.id} className="history-item">
                <div>
                  <div className="history-location">{item.location_name}</div>
                  <div className="history-date">{formatDate(item.created_at)}</div>
                </div>
                <div className="history-points">+{item.points}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!user.history || user.history.length === 0) && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)' }}>
          История пуста. Отсканируйте QR-код, чтобы получить баллы!
        </div>
      )}
    </div>
  );
}

export default Profile;
