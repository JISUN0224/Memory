import React, { useState, useEffect, useRef } from 'react';
import './FirstStep.css';
import { Tour } from './Tour';
import LoginButton from './LoginButton';
import { saveMemorySession } from '../utils/memoryDataUtils';
import { auth } from '../firebase/config';

interface ExerciseContent {
  script: string;
  duration: number;
  type: string;
  difficulty: string;
}

interface FirstStepProps {
  onComplete: (data: {
    script: string;
    keyPoints: string[];
    title: string;
    duration: number;
    category: string;
    type: string;
  }) => void;
  onGoHome: () => void;
}

const FirstStep: React.FC<FirstStepProps> = ({ onComplete, onGoHome }) => {
  const [selectedType, setSelectedType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('한국어');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exerciseContent, setExerciseContent] = useState<ExerciseContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setUsedModel] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  
  // 타이머 상태
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  
  // refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // 컴포넌트 마운트 시 튜토리얼 표시 여부 확인
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('memory-tour-completed');
    if (!hasSeenTour) {
      // 약간의 지연 후 튜토리얼 시작
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 홈으로 돌아가기 - 모든 상태 초기화
  const handleGoHome = () => {
    // 타이머 정리
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // 모든 상태 초기화
    setSelectedType('');
    setSelectedLanguage('한국어');
    setCustomPrompt('');
    setIsGenerating(false);
    setExerciseContent(null);
    setError(null);
    setUsedModel(null);
    setShowTour(false);
    setTimeRemaining(0);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setTimerCompleted(false);
    
    // 부모 컴포넌트에 홈으로 이동 알림
    onGoHome();
  };

  // 튜토리얼 닫기 핸들러
  const handleTourClose = (opts?: { dontShowAgain?: boolean }) => {
    setShowTour(false);
    if (opts?.dontShowAgain) {
      localStorage.setItem('memory-tour-completed', 'true');
    }
  };

  // 튜토리얼 스텝 정의
  const tourSteps = [
    {
      id: 'type-selector',
      title: '유형 및 언어 선택',
      description: '먼저 연습할 유형(숫자 중심, 인명/지명 등)과 언어(한국어, 중국어)를 선택해주세요.',
      targetSelector: '.type-selector',
    },
    {
      id: 'prompt-input',
      title: '추가 요청사항',
      description: '필요에 따라 난이도나 특정 주제에 대한 추가 요청사항을 입력할 수 있습니다.',
      targetSelector: '.prompt-input-container',
    },
    {
      id: 'generate-button',
      title: '문제 생성',
      description: '모든 설정이 완료되면 이 버튼을 클릭하여 AI가 생성한 연습문제를 받아보세요.',
      targetSelector: '.button-container',
    },
    {
      id: 'guide-panel',
      title: '메모리 훈련 가이드',
      description: '오른쪽 패널에서 메모리 훈련의 목적, 단계별 학습 방법, 효과 등을 확인할 수 있습니다.',
      targetSelector: '.guide-panel',
      padding: 16,
    },
  ];

  // 모델 fallback 설정
  const modelConfigs = [
    {
      name: 'gemini-2.5-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      config: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    },
    {
      name: 'gemini-2.5-flash-lite',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      config: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    },
    {
      name: 'gemini-2.0-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      config: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    },
    {
      name: 'gemini-1.5-flash-8b',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent',
      config: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    },
    {
      name: 'gpt-4o-mini',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      config: {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 2048
      }
    },
    {
      name: 'gpt-3.5-turbo-0125',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      config: {
        model: 'gpt-3.5-turbo-0125',
        temperature: 0.3,
        max_tokens: 2048
      }
    },
    {
      name: 'gpt-4.1-mini',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      config: {
        model: 'gpt-4.1-mini',
        temperature: 0.3,
        max_tokens: 2048
      }
    }
  ];

  // API 호출 함수 (Gemini + GPT 지원)
  const callAIAPI = async (modelConfig: typeof modelConfigs[0], prompt: string, apiKey: string) => {
    
    let requestBody: any;
    let headers: any = {
      'Content-Type': 'application/json',
    };

    // Gemini 모델인지 GPT 모델인지 확인
    const isGeminiModel = modelConfig.name.startsWith('gemini');
    
    if (isGeminiModel) {
      // Gemini API 호출 (URL 파라미터로 API 키 전달)
      requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: modelConfig.config
      };
    } else {
      // GPT API 호출 (Authorization 헤더로 API 키 전달)
      headers['Authorization'] = `Bearer ${apiKey}`;
      requestBody = {
        model: modelConfig.config.model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: modelConfig.config.temperature,
        max_tokens: modelConfig.config.max_tokens
      };
    }

    const endpoint = isGeminiModel ? `${modelConfig.endpoint}?key=${apiKey}` : modelConfig.endpoint;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || response.statusText;
      
      // API limit 관련 에러인지 확인 (인증 에러는 제외)
      const isLimitError = (errorMessage.includes('quota') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('rate') ||
                          errorMessage.includes('overloaded') ||
                          errorMessage.includes('unavailable') ||
                          response.status === 429 ||
                          response.status === 503) &&
                          !errorMessage.includes('authentication') &&
                          !errorMessage.includes('Unauthorized') &&
                          response.status !== 401;
      
      if (isLimitError) {
        throw new Error(`LIMIT_ERROR: ${errorMessage}`);
      } else {
        throw new Error(`API_ERROR: ${errorMessage}`);
      }
    }

    const data = await response.json();
    
    if (isGeminiModel) {
      // Gemini 응답 처리
      if (!data.candidates || !data.candidates[0]) {
        throw new Error('API 응답에 candidates가 없습니다.');
      }
      return data;
    } else {
      // GPT 응답 처리
      if (!data.choices || !data.choices[0]) {
        throw new Error('API 응답에 choices가 없습니다.');
      }
      // GPT 응답을 Gemini 형식으로 변환
      return {
        candidates: [{
          content: {
            parts: [{
              text: data.choices[0].message.content
            }]
          },
          finishReason: data.choices[0].finish_reason
        }]
      };
    }
  };

  // 문제 생성 함수
  const generateExercise = async () => {
    if (!selectedType) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // API 키 설정 (Gemini 우선, 없으면 GPT 사용)
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const gptApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!geminiApiKey && !gptApiKey) {
        throw new Error('API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY 또는 VITE_OPENAI_API_KEY를 설정해주세요.');
      }

      const prompt = `Write 3-4 ${selectedLanguage} sentences for interpreter memory training about ${selectedType}:
Create a coherent story with logical flow and context. For example, instead of separate facts like "A visited X. B visited Y.", create connected narrative like "A visited X where they met B, who is from C...".
${customPrompt ? `Additional requirements: ${customPrompt}` : ''}
Output only the text, no explanations.`;


      // 모델들을 순차적으로 시도
      let lastError: Error | null = null;
      let data: any = null;
      let successfulModel: string | null = null;

      // 최대 7개 모델까지 시도
      const modelsToTry = modelConfigs.slice(0, 7);
      
      for (const modelConfig of modelsToTry) {
        try {
          // 모델에 따라 적절한 API 키 선택
          const isGeminiModel = modelConfig.name.startsWith('gemini');
          const apiKey = isGeminiModel ? geminiApiKey : gptApiKey;
          
          if (!apiKey) {
            continue;
          }
          
          data = await callAIAPI(modelConfig, prompt, apiKey);
          successfulModel = modelConfig.name;
          break; // 성공하면 루프 종료
        } catch (error) {
          lastError = error as Error;
          
          // API limit 에러가 아니면 다음 모델 시도하지 않음
          if (!lastError.message.startsWith('LIMIT_ERROR:')) {
            break;
          }
          
        }
      }

      // 모든 모델이 실패한 경우
      if (!data) {
        const errorMessage = lastError?.message || '모든 모델에서 API 호출이 실패했습니다.';
        if (errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
          throw new Error('현재 AI 서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
        }
        throw lastError || new Error('문제 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      }

      // 성공한 모델 정보 저장
      setUsedModel(successfulModel);

             const candidate = data.candidates[0];
       
       if (candidate.finishReason === 'MAX_TOKENS') {
         // 부분적으로라도 텍스트가 있는지 확인
         const partialText = candidate.content?.parts?.[0]?.text;
         if (partialText && partialText.trim().length > 50) {
           // 마지막 완전한 문장까지만 사용
           const sentences = partialText.split(/[.!?。！？]/);
           const completeSentences = sentences.slice(0, -1).join('.') + '.';
           const cleanText = completeSentences.trim();
           if (cleanText.length > 30) {
             setExerciseContent({
               script: cleanText,
               duration: 60,
               type: selectedType,
               difficulty: 'medium'
             });
             setTimeRemaining(60);
             return;
           }
         }
       }
       
       if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
         throw new Error('API 응답 구조가 올바르지 않습니다. finishReason: ' + candidate.finishReason);
       }

       const generatedText = candidate.content.parts[0].text;
       
       if (!generatedText) {
         throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
       }

      const cleanText = generatedText.trim();

      setExerciseContent({
        script: cleanText,
        duration: 60,
        type: selectedType,
        difficulty: 'medium'
      });
      setTimeRemaining(60);
    } catch (error) {
      console.error('생성 실패:', error);
      setError(error instanceof Error ? error.message : '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 타이머 시작
  const startTimer = () => {
    if (!exerciseContent || isTimerRunning) return;
    
    setIsTimerRunning(true);
    setIsTimerPaused(false);
    setTimerCompleted(false);
    
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setIsTimerRunning(false);
          setTimerCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 타이머 일시정지
  const pauseTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsTimerRunning(false);
    setIsTimerPaused(true);
  };

  // 타이머 재시작
  const resumeTimer = () => {
    if (isTimerPaused && timeRemaining > 0) {
      startTimer();
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 계산
  const getProgress = () => {
    if (!exerciseContent) return 0;
    return ((exerciseContent.duration - timeRemaining) / exerciseContent.duration) * 100;
  };

  return (
    <>
      {/* 로그인 버튼 - 오른쪽 상단 */}
      <LoginButton className="login-button-top-right" />
      
      <div className="container">
        {/* 메인 제목 */}
        <div className="main-title-section">
          <h1 className="main-title">5.3.1 AI 메모리 연습 시스템</h1>
        </div>

        {/* 메인 콘텐츠와 사이드바 래퍼 */}
        <div className="content-wrapper">
          {/* 메인 콘텐츠 */}
          <div className="main-content">
        {/* 홈으로 버튼 */}
        <button onClick={handleGoHome} className="home-btn">
          <span>🏠</span>
          <span>홈으로</span>
        </button>
          
                   {/* 헤더 */}
                     <div className="header">
              <div className="header-content">
                <div>
                  <h1>🧠 통역 메모리 훈련</h1>
                  <p>1단계: 타이머 학습</p>
                </div>
              </div>
            </div>
        
        {/* 단계 표시기 */}
        <div className="step-indicator">
          <div className="step active">1</div>
          <div className="step inactive">2</div>
          <div className="step inactive">3</div>
          <div className="step inactive">4</div>
        </div>
        
        {/* 유형 및 언어 선택 */}
        <div className="type-selector">
          <div className="selector-box">
            <label>🎯 유형 선택</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">선택하세요</option>
              <option value="숫자 중심">숫자 중심</option>
              <option value="인명/지명">인명/지명</option>
              <option value="목록/순서">목록/순서</option>
              <option value="과정/절차">과정/절차</option>
            </select>
          </div>
          
          <div className="selector-box">
            <label>🌐 언어 옵션</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="한국어">한국어</option>
              <option value="중국어">중국어</option>
            </select>
          </div>
        </div>
        
        {/* 추가 요청사항 입력 */}
        <div className="prompt-input-container">
          <div className="prompt-input-box">
            <label>📝 추가 요청사항</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="(선택옵션)해당 유형에 대한 추가 요청 사항이 있다면 입력해주세요. 예:난이도, 주제 등"
              className="prompt-textarea"
            />
          </div>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            <div className="error-content">
              <p className="error-text">⚠️ {error}</p>
              <button 
                onClick={() => setError(null)} 
                className="error-retry-btn"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 스크립트 영역 */}
        <div className="script-area">
          {isGenerating ? (
            <div className="script-placeholder">
              <div className="loading-spinner"></div>
              <p>연습문제를 생성하는 중...</p>
            </div>
          ) : exerciseContent ? (
            <div className="script-content">
              {timerCompleted ? (
                <div className="completion-message">
                  ✅ 학습 시간이 완료되었습니다!<br />
                  이제 2단계에서 기억한 내용을 테스트해보세요.
                </div>
              ) : (
                                 exerciseContent.script
              )}
            </div>
          ) : (
            <div className="script-placeholder">
              필터를 모두 선택하면 연습문제가 표시됩니다
            </div>
          )}
        </div>

        {/* 문제 생성 버튼 */}
        {!exerciseContent && (
          <div className="button-container">
            <button
              onClick={generateExercise}
              disabled={!selectedType || isGenerating}
              className={`generate-btn ${!selectedType || isGenerating ? 'disabled' : ''}`}
            >
              {isGenerating ? '생성 중...' : `${selectedLanguage} 문제 생성`}
            </button>
          </div>
        )}

        {/* 타이머 섹션 */}
        {exerciseContent && (
          <div className="timer-section">
            <div className="timer-display">
              <div className="timer-text">{formatTime(timeRemaining)}</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
            </div>

            <div className="timer-controls">
              {!timerCompleted ? (
                <>
                  {!isTimerRunning && !isTimerPaused ? (
                    <button onClick={startTimer} className="timer-btn start">
                      🚀 학습 시작
                    </button>
                  ) : isTimerPaused ? (
                    <button onClick={resumeTimer} className="timer-btn resume">
                      ▶️ 재시작
                    </button>
                  ) : (
                    <>
                      <button onClick={pauseTimer} className="timer-btn pause">
                        ⏸️ 일시정지
                      </button>
                      <button 
                        onClick={async () => {
                          if (exerciseContent) {
                            const text = exerciseContent.script;
                            let keyPoints: string[] = [];
                            
                            // 언어 자동 감지
                            const isChinese = /[\u4e00-\u9fff]/.test(text);
                            const isKorean = /[가-힣]/.test(text);
                            
                            
                            if (isChinese) {
                              // 🇨🇳 중국어 키워드 추출
                              
                              // 1. 순서/연결 표현어 (높은 우선순위)
                              const orderWords: string[] = text.match(/首先|其次|然后|接着|最后|第一|第二|第三|另外|此外|同时|因此|所以|但是|然而/g) || [];
                              
                              // 2. 핵심 개념어 (2-4글자 명사)
                              const conceptWords: string[] = text.match(/市场调研|需求分析|可行性评估|功能设计|界面规划|技术研发|内部测试|性能测试|兼容性测试|用户体验|批量生产|市场推广|产品发布/g) || [];
                              
                              // 3. 동작 표현 (동사+목적어)
                              const actionWords: string[] = text.match(/进行[\u4e00-\u9fff]{1,4}|完成[\u4e00-\u9fff]{1,4}|启动[\u4e00-\u9fff]{1,4}|策划[\u4e00-\u9fff]{1,4}|执行[\u4e00-\u9fff]{1,4}/g) || [];
                              
                              // 4. 2-3글자 핵심 단어
                              const shortWords: string[] = text.match(/[\u4e00-\u9fff]{2,3}(?=[，。、：；]|$)/g) || [];
                              const filteredShortWords = shortWords.filter(word => 
                                !orderWords.includes(word) && 
                                !conceptWords.includes(word) &&
                                !['进行', '完成', '启动', '策划', '执行'].includes(word)
                              );
                              
                              // 우선순위대로 합치기
                              keyPoints = [
                                ...orderWords.slice(0, 3),           // 순서어 최대 3개
                                ...conceptWords.slice(0, 4),         // 개념어 최대 4개  
                                ...actionWords.slice(0, 2),          // 동작어 최대 2개
                                ...filteredShortWords.slice(0, 3)    // 기타 단어 최대 3개
                              ];
                              
                              // 중복 제거 및 길이 제한
                              keyPoints = [...new Set(keyPoints)].slice(0, 8);
                              
                              
                            } else if (isKorean) {
                              // 🇰🇷 한국어 키워드 추출
                              
                              // 1. 순서/연결 표현어
                              const orderWords: string[] = text.match(/먼저|첫째|둘째|셋째|다음|그리고|또한|마지막|따라서|그러나|하지만|즉|결국/g) || [];
                              
                              // 2. 명사 (2-4글자)
                              const nouns = text.match(/[가-힣]{2,4}(?=[을를이가는은 .,!?])/g) || [];
                              const filteredNouns = nouns.filter(word => 
                                !orderWords.includes(word) &&
                                !['것을', '것이', '하는', '되는', '있는', '없는'].includes(word)
                              );
                              
                              // 3. 용언 어간 (동사/형용사)
                              const verbs = text.match(/[가-힣]+(?=하[다며면고]|되[다며면고]|있[다며면고]|없[다며면고])/g) || [];
                              const filteredVerbs = verbs.filter(word => word.length >= 2 && word.length <= 4);
                              
                              // 4. 공백으로 분리된 단어들 중 적절한 길이
                              const words = text.split(/\s+/).filter(word => 
                                /[가-힣]/.test(word) && 
                                word.length >= 2 && 
                                word.length <= 5 &&
                                !word.match(/^[은는이가을를에서로부터까지]/)
                              );
                              
                              // 우선순위대로 합치기
                              keyPoints = [
                                ...orderWords.slice(0, 2),           // 순서어 최대 2개
                                ...filteredNouns.slice(0, 4),        // 명사 최대 4개
                                ...filteredVerbs.slice(0, 2),        // 동사 최대 2개
                                ...words.slice(0, 4)                 // 기타 단어 최대 4개
                              ];
                              
                              // 중복 제거 및 길이 제한
                              keyPoints = [...new Set(keyPoints)].slice(0, 6);
                              
                              
                            } else {
                              // 🌍 기타 언어 (영어 등)
                              const words = text.split(/\s+/);
                              keyPoints = words.filter(word => word.length > 3 && word.length < 8).slice(0, 5);
                            }
                            
                            // 키워드가 부족한 경우 추가 추출
                            if (keyPoints.length < 3) {
                              
                              if (isChinese) {
                                // 중국어: 더 관대한 조건으로 재추출
                                const additionalWords = text.match(/[\u4e00-\u9fff]{2,4}/g) || [];
                                const newWords = additionalWords
                                  .filter(word => !keyPoints.includes(word))
                                  .slice(0, 5 - keyPoints.length);
                                keyPoints = [...keyPoints, ...newWords];
                              } else if (isKorean) {
                                // 한국어: 더 관대한 조건으로 재추출  
                                const additionalWords = text.match(/[가-힣]{2,4}/g) || [];
                                const newWords = additionalWords
                                  .filter(word => !keyPoints.includes(word))
                                  .slice(0, 5 - keyPoints.length);
                                keyPoints = [...keyPoints, ...newWords];
                              }
                            }
                            
                            
                            // keyPoints가 여전히 비어있으면 기본값
                            if (keyPoints.length === 0) {
                              console.warn('키워드 추출 완전 실패, 기본값 사용');
                              if (isChinese) {
                                keyPoints = ['项目', '市场', '产品', '测试', '生产'];
                              } else if (isKorean) {
                                keyPoints = ['프로젝트', '시장', '제품', '테스트', '생산'];
                              } else {
                                keyPoints = ['project', 'market', 'product', 'test', 'production'];
                              }
                            }
                            
                            // Firebase에 메모리 훈련 세션 저장
                            if (auth.currentUser) {
                              try {
                                await saveMemorySession({
                                  date: new Date().toISOString(),
                                  exerciseType: selectedType,
                                  totalScore: 100, // 1단계 완료 시 기본 점수
                                  stepCount: 1, // 1단계만 완료
                                  studyTime: exerciseContent.duration - timeRemaining,
                                  averageScore: 100,
                                  language: selectedLanguage,
                                  steps: [{
                                    stepId: 1,
                                    stepName: '타이머 학습',
                                    score: 100,
                                    timeUsed: exerciseContent.duration - timeRemaining,
                                    completed: true,
                                    details: {
                                      script: exerciseContent.script,
                                      keyPoints: keyPoints
                                    }
                                  }],
                                  metadata: {
                                    difficulty: 'medium',
                                    customPrompt: customPrompt,
                                    aiGenerated: true
                                  }
                                });
                              } catch (error) {
                                console.error('세션 저장 실패:', error);
                              }
                            }

                            onComplete({
                              script: exerciseContent.script,
                              keyPoints: keyPoints,
                              title: `${selectedType} 훈련`,
                              duration: exerciseContent.duration,
                              category: 'memory',
                              type: selectedType
                            });
                          }
                        }}
                        className="timer-btn next"
                      >
                        ➡️ 다음 단계
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button className="timer-btn complete">
                  ➡️ 2단계로 이동
                </button>
              )}
            </div>
          </div>
        )}
          </div>
          
          {/* 사이드바 */}
          <div className="sidebar">
        <div className="guide-panel">
          {/* 헤더 */}
          <div className="guide-header">
            <span style={{fontSize: '1.5rem'}}>🧠</span>
            <h3>메모리 훈련 가이드</h3>
          </div>
          
          {/* 훈련 목적 */}
          <div className="purpose-section">
            <div className="section-title">훈련 목적</div>
            <div className="purpose-box">
              <p>통역사에게 필수적인 <strong>순간 기억력</strong>과 <strong>정보 재구성 능력</strong>을 체계적으로 향상시킵니다.</p>
            </div>
          </div>
          
          {/* 학습 단계 */}
          <div className="steps-section">
            <div className="section-title">학습 단계</div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number blue">1</span>
                <span className="step-name">타이머학습</span>
              </div>
              <div className="step-desc">집중해서 내용 기억</div>
            </div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number orange">2</span>
                <span className="step-name">빈칸채우기</span>
              </div>
              <div className="step-desc">핵심 단어 기억 테스트</div>
            </div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number green">3</span>
                <span className="step-name">문장재배열</span>
              </div>
              <div className="step-desc">논리적 순서 재구성</div>
            </div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number purple">4</span>
                <span className="step-name">스토리재생산</span>
              </div>
              <div className="step-desc">완전한 내용 복원</div>
            </div>
          </div>
          
          {/* 훈련 방법론 */}
          <div className="methodology-section">
            <div className="methodology-header">
              <span style={{fontSize: '1.1rem'}}>📚</span>
              <span className="methodology-title">훈련 방법론</span>
              <span style={{fontSize: '1.1rem'}}>▼</span>
            </div>
            <div className="methodology-content">
              <div className="methodology-item"><strong>청킹(Chunking):</strong> 정보를 의미 단위로 기억</div>
              <div className="methodology-item"><strong>시각화:</strong> 내용을 이미지로 변환하여 저장</div>
              <div className="methodology-item"><strong>연상 기법:</strong> 기존 지식과 연결하여 기억 강화</div>
            </div>
          </div>
          
          {/* 학습 효과 */}
          <div className="effects-section">
            <div className="effects-header">
              <span style={{fontSize: '1.1rem'}}>🎯</span>
              <span className="effects-title">학습 효과</span>
            </div>
            <ul className="effects-list">
              <li>단기 기억력 향상</li>
              <li>정보 처리 속도 증가</li>
              <li>집중력 강화</li>
              <li>논리적 사고력 발달</li>
              <li>실전 통역 능력 향상</li>
            </ul>
          </div>
                 </div>
           </div>
         </div>

         {/* 튜토리얼 */}
         <Tour
           steps={tourSteps}
           visible={showTour}
           onClose={handleTourClose}
         />
        </div>
      </>
    );
};

export default FirstStep; 