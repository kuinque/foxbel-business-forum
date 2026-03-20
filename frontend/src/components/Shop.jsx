import { useState, useEffect } from 'react';
import { getProducts, purchaseProduct, getPurchaseHistory } from '../api';

function Shop({ userBalance, onPurchase }) {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsResult, purchasesResult] = await Promise.all([
        getProducts(),
        getPurchaseHistory()
      ]);
      setProducts(productsResult.products);
      setPurchases(purchasesResult.purchases);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product) => {
    if (purchasing) return;
    
    setMessage(null);
    setPurchasing(product.id);
    
    try {
      const result = await purchaseProduct(product.id);
      setMessage({
        type: 'success',
        text: `Вы приобрели "${product.name}"! Новый баланс: ${result.new_balance} баллов`
      });
      
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, quantity: p.quantity - 1 } : p
      ));
      
      setPurchases(prev => [{
        id: result.id,
        product_name: result.product_name,
        points_spent: result.points_spent,
        created_at: result.created_at
      }, ...prev]);
      
      if (onPurchase) {
        onPurchase(result.new_balance);
      }
    } catch (e) {
      setMessage({
        type: 'error',
        text: e.message
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка товаров...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="message message-error">{error}</div>
        <button className="btn btn-primary" onClick={loadProducts}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card balance-card" style={{ marginBottom: '16px' }}>
        <div className="balance-value">{userBalance}</div>
        <div className="balance-label">Ваши баллы</div>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="section-title">Товары</div>

      {products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)' }}>
          Товары пока недоступны
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {products.map(product => (
            <div key={product.id} className="card" style={{ padding: '16px' }}>
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}
                />
              )}
              
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                  {product.name}
                </div>
                {product.description && (
                  <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
                    {product.description}
                  </div>
                )}
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '18px',
                  color: 'var(--tg-theme-button-color)'
                }}>
                  {product.price_points} баллов
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: product.quantity > 0 ? 'var(--tg-theme-hint-color)' : '#dc3545'
                }}>
                  {product.quantity > 0 ? `В наличии: ${product.quantity}` : 'Нет в наличии'}
                </div>
              </div>
              
              <button
                className={`btn ${userBalance >= product.price_points && product.quantity > 0 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePurchase(product)}
                disabled={purchasing === product.id || userBalance < product.price_points || product.quantity <= 0}
                style={{
                  opacity: (userBalance < product.price_points || product.quantity <= 0) ? 0.5 : 1
                }}
              >
                {purchasing === product.id 
                  ? 'Покупка...' 
                  : userBalance < product.price_points 
                    ? 'Недостаточно баллов'
                    : product.quantity <= 0
                      ? 'Нет в наличии'
                      : 'Купить'
                }
              </button>
            </div>
          ))}
        </div>
      )}

      <button 
        className="btn btn-secondary" 
        onClick={loadData}
        style={{ marginTop: '16px' }}
      >
        Обновить
      </button>

      {purchases.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div className="section-title">Мои покупки</div>
          <div className="card">
            {purchases.map(purchase => (
              <div key={purchase.id} className="history-item">
                <div>
                  <div className="history-location">{purchase.product_name}</div>
                  <div className="history-date">
                    {new Date(purchase.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div style={{ fontWeight: '600', color: '#dc3545' }}>
                  -{purchase.points_spent}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;
