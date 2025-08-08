import React, { useState, useEffect, useRef } from 'react';
import './FirstStep.css';

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
    setTimeRemaining(0);
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setTimerCompleted(false);
    
    // 부모 컴포넌트에 홈으로 이동 알림
    onGoHome();
  };

  // 문제 생성 함수
  const generateExercise = async () => {
    if (!selectedType) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // API 키 설정
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      }

             const prompt = `Write 3-4 ${selectedLanguage} sentences for interpreter memory training about ${selectedType}:
Create a coherent story with logical flow and context. For example, instead of separate facts like "A visited X. B visited Y.", create connected narrative like "A visited X where they met B, who is from C...".
${customPrompt ? `Additional requirements: ${customPrompt}` : ''}
Output only the text, no explanations.`;

      console.log('프롬프트 길이:', prompt.length);
      console.log('예상 토큰 수:', Math.ceil(prompt.length / 4));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 호출 실패: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('API 응답:', data); // 디버깅용
      console.log('candidates[0]:', data.candidates?.[0]); // 더 자세한 디버깅

      // 응답 구조 확인
      if (!data.candidates || !data.candidates[0]) {
        throw new Error('API 응답에 candidates가 없습니다.');
      }

             const candidate = data.candidates[0];
       console.log('finishReason:', candidate.finishReason);
       console.log('candidate.content:', candidate.content);
       console.log('candidate.content.parts:', candidate.content?.parts);
       console.log('candidate.content.parts[0]:', candidate.content?.parts?.[0]);
       
       if (candidate.finishReason === 'MAX_TOKENS') {
         console.log('MAX_TOKENS로 인해 응답이 중단되었습니다.');
         // 부분적으로라도 텍스트가 있는지 확인
         const partialText = candidate.content?.parts?.[0]?.text;
         if (partialText && partialText.trim().length > 50) {
           console.log('부분 텍스트 사용:', partialText);
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
         console.log('candidate.content.parts:', candidate.content?.parts);
         throw new Error('API 응답 구조가 올바르지 않습니다. finishReason: ' + candidate.finishReason);
       }

       const generatedText = candidate.content.parts[0].text;
       console.log('generatedText:', generatedText);
       
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
    <div className="container">
      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {/* 홈으로 버튼 */}
        <button onClick={handleGoHome} className="home-btn">
          <span>🏠</span>
          <span>홈으로</span>
        </button>
        
        {/* 헤더 */}
        <div className="header">
          <h1>🧠 통역 메모리 훈련</h1>
          <p>1단계: 타이머 학습</p>
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
                        onClick={() => {
                          if (exerciseContent) {
                            const text = exerciseContent.script;
                            let keyPoints: string[] = [];
                            
                            // 언어 자동 감지
                            const isChinese = /[\u4e00-\u9fff]/.test(text);
                            const isKorean = /[가-힣]/.test(text);
                            
                            console.log('언어 감지:', { isChinese, isKorean, selectedLanguage });
                            
                            if (isChinese) {
                              // 🇨🇳 중국어 키워드 추출
                              console.log('중국어 키워드 추출 시작');
                              
                              // 1. 순서/연결 표현어 (높은 우선순위)
                              const orderWords = text.match(/首先|其次|然后|接着|最后|第一|第二|第三|另外|此外|同时|因此|所以|但是|然而/g) || [];
                              
                              // 2. 핵심 개념어 (2-4글자 명사)
                              const conceptWords = text.match(/市场调研|需求分析|可行性评估|功能设计|界面规划|技术研发|内部测试|性能测试|兼容性测试|用户体验|批量生产|市场推广|产品发布/g) || [];
                              
                              // 3. 동작 표현 (동사+목적어)
                              const actionWords = text.match(/进行[\u4e00-\u9fff]{1,4}|完成[\u4e00-\u9fff]{1,4}|启动[\u4e00-\u9fff]{1,4}|策划[\u4e00-\u9fff]{1,4}|执行[\u4e00-\u9fff]{1,4}/g) || [];
                              
                              // 4. 2-3글자 핵심 단어
                              const shortWords = text.match(/[\u4e00-\u9fff]{2,3}(?=[，。、：；]|$)/g) || [];
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
                              
                              console.log('중국어 키워드 추출 결과:', {
                                orderWords,
                                conceptWords, 
                                actionWords,
                                shortWords: filteredShortWords.slice(0, 3),
                                final: keyPoints
                              });
                              
                            } else if (isKorean) {
                              // 🇰🇷 한국어 키워드 추출
                              console.log('한국어 키워드 추출 시작');
                              
                              // 1. 순서/연결 표현어
                              const orderWords = text.match(/먼저|첫째|둘째|셋째|다음|그리고|또한|마지막|따라서|그러나|하지만|즉|결국/g) || [];
                              
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
                              
                              console.log('한국어 키워드 추출 결과:', {
                                orderWords,
                                nouns: filteredNouns.slice(0, 4),
                                verbs: filteredVerbs.slice(0, 2),
                                words: words.slice(0, 4),
                                final: keyPoints
                              });
                              
                            } else {
                              // 🌍 기타 언어 (영어 등)
                              console.log('기타 언어 키워드 추출');
                              const words = text.split(/\s+/);
                              keyPoints = words.filter(word => word.length > 3 && word.length < 8).slice(0, 5);
                            }
                            
                            // 키워드가 부족한 경우 추가 추출
                            if (keyPoints.length < 3) {
                              console.log('키워드 부족, 추가 추출 시도');
                              
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
                            
                            console.log('최종 키워드:', keyPoints);
                            
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
  );
};

export default FirstStep; 