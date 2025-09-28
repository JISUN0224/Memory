import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import LoginModal from './LoginModal';
import './LoginButton.css';

interface LoginButtonProps {
  className?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ className = '' }) => {
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setUser(user);
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className={`login-container ${className}`}>
      <div className="button-group">
        {/* 로그인/사용자 버튼 */}
        {user ? (
          <div className="user-menu">
            <button 
              className="user-btn" 
              onClick={toggleDropdown}
            >
              <span className="user-icon">👤</span>
              <span className="user-text">{user.displayName || user.email}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item">
                  <span className="dropdown-icon">👤</span>
                  <span>프로필</span>
                </div>
                <div className="dropdown-item">
                  <span className="dropdown-icon">⚙️</span>
                  <span>설정</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>로그아웃</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            className="login-btn" 
            onClick={() => setIsModalOpen(true)}
          >
            <span className="login-icon">🔑</span>
            <span className="login-text">로그인</span>
          </button>
        )}

        {/* 대시보드 버튼 */}
        <button 
          className="dashboard-btn" 
          onClick={() => window.location.href = '/dashboard'}
        >
          <span className="dashboard-icon">📊</span>
          <span className="dashboard-text">대시보드</span>
        </button>
      </div>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default LoginButton;
