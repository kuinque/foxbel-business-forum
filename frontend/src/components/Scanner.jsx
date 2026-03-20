import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { scanQR } from '../api';

function Scanner({ onSuccess }) {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setMessage(null);
    setScanning(true);

    try {
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      setMessage({ type: 'error', text: 'Не удалось запустить камеру: ' + err.message });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    await stopScanner();
    setLoading(true);

    try {
      // Извлекаем токен из QR-кода
      // QR может содержать просто токен или URL с параметром
      let token = decodedText;
      
      // Если это URL, пытаемся извлечь токен
      if (decodedText.includes('?')) {
        const url = new URL(decodedText);
        token = url.searchParams.get('token') || url.searchParams.get('startapp') || decodedText;
      }

      const result = await scanQR(token);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message,
        });
        onSuccess?.();
      } else {
        setMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error) => {
    // Игнорируем ошибки "QR code not found"
  };

  // Попробуем использовать встроенный сканер Telegram
  const useTelegramScanner = () => {
    const tg = window.Telegram?.WebApp;
    
    if (tg?.showScanQrPopup) {
      tg.showScanQrPopup(
        { text: 'Наведите камеру на QR-код' },
        (text) => {
          if (text) {
            onScanSuccess(text);
            return true; // Закрыть сканер
          }
          return false;
        }
      );
    } else {
      startScanner();
    }
  };

  return (
    <div>
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {loading && (
        <div className="loading">Проверка QR-кода...</div>
      )}

      {!scanning && !loading && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px', color: 'var(--tg-theme-hint-color)' }}>
            Отсканируйте QR-код на точке, чтобы получить баллы
          </p>
          <button className="btn btn-primary" onClick={useTelegramScanner}>
            Сканировать QR-код
          </button>
        </div>
      )}

      {scanning && (
        <div>
          <div id="qr-reader" className="scanner-container" ref={scannerRef}></div>
          <button 
            className="btn btn-secondary" 
            onClick={stopScanner}
            style={{ marginTop: '16px' }}
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}

export default Scanner;
