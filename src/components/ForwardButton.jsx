import React from 'react';
import { useNavigate } from 'react-router-dom';

function ForwardButton({ message, path }) {
  const navigate = useNavigate();
  
  return (
    <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 10000,
        padding: '5px 10px',
      }}>
        <button 
          onClick={() => navigate(path)}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#00ffff',
            border: '1px solid #00ffff',
            cursor: 'pointer',
            fontSize: window.innerWidth < 640 ? '12px' : '14px',
            padding: window.innerWidth < 640 ? '12px 16px' : '8px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            transition: 'all 0.3s ease',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(0, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.3)';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
          onTouchStart={(e) => {
            e.target.style.background = 'rgba(0, 255, 255, 0.1)';
            e.target.style.transform = 'scale(0.95)';
          }}
          onTouchEnd={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.3)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          {message} →
        </button>
      </div>
      );
}

export default ForwardButton;
