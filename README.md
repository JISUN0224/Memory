# 5.3.1 AI 메모리 연습 시스템

AI 기반 통역 메모리 훈련 시스템입니다.

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 환경변수들을 설정하세요:

```env
# AI API Keys
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. 개발 서버 실행
```bash
npm run dev
```

## 🔧 기술 스택

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **AI Models**: Google Gemini, OpenAI GPT
- **Charts**: Chart.js, React-Chartjs-2

## 📱 주요 기능

- AI 기반 메모리 훈련 콘텐츠 생성
- 다중 AI 모델 폴백 시스템 (7개 모델)
- 사용자 인증 및 데이터 저장
- 학습 통계 대시보드
- 다국어 지원 (한국어, 중국어, 영어)

## 🔐 보안

- 모든 API 키는 환경변수로 관리
- `.env` 파일은 Git에 포함되지 않음
- Firebase 보안 규칙 적용

## 📄 라이선스

MIT License
