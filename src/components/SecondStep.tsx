import React, { useState, useEffect } from 'react';
import './SecondStep.css';

interface SecondStepProps {
  exerciseData: {
    script: string;
    keyPoints: string[];
    title: string;
    duration: number;
    category: string;
    type: string;
  };
  onComplete: (score: number) => void;
  onPrevious: () => void;
  onGoHome: () => void;
}

interface BlankAnswer {
  id: number;
  answer: string;
  isCorrect: boolean;
  showHint: boolean;
  originalWord: string; // 원본 단어 저장
}

const SecondStep: React.FC<SecondStepProps> = ({ exerciseData, onComplete, onPrevious, onGoHome }) => {
  const [blankAnswers, setBlankAnswers] = useState<BlankAnswer[]>([]);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [processedScript, setProcessedScript] = useState('');
  const [highlightedBlank, setHighlightedBlank] = useState<number | null>(null);
  const [hintContent, setHintContent] = useState<string>('');

  // 정규식 특수문자 이스케이프
  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 빈칸 생성 및 초기화
  useEffect(() => {
    if (exerciseData.script && exerciseData.keyPoints) {
      const text = exerciseData.script;
      const keywords = exerciseData.keyPoints;
      const blanks: BlankAnswer[] = [];
      let processedText = text;
      
      // 키워드 매치 타입 정의
      interface KeywordMatch {
        keyword: string;
        index: number;
        start: number;
        end: number;
        originalWord: string;
      }
      
      const allKeywordMatches: KeywordMatch[] = [];
      const keywordToMatchMap = new Map<string, number>();

      keywords.forEach((keyword, index) => {
        keywordToMatchMap.set(keyword.toLowerCase(), index + 1);
        const regex = new RegExp(escapeRegex(keyword), 'gi');
        const matches = [...text.matchAll(regex)];
        matches.forEach(match => {
          allKeywordMatches.push({
            keyword,
            index: index + 1,
            start: match.index!,
            end: match.index! + match[0].length,
            originalWord: match[0]
          });
        });
      });
      
      // 위치순으로 정렬
      const sortedMatches = allKeywordMatches.sort((a, b) => a.start - b.start);
      
      const selectedBlanks: KeywordMatch[] = [];
      const MIN_DISTANCE = 5; // 최소 5글자 간격
      const MAX_BLANKS = 5; // 최대 빈칸 수
      
      let lastEndIndex = -Infinity;
      
      for (const match of sortedMatches) {
        // 이전 빈칸과의 거리가 충분히 떨어져 있는지 확인
        if (match.start >= lastEndIndex + MIN_DISTANCE) {
          selectedBlanks.push(match);
          lastEndIndex = match.end;
          if (selectedBlanks.length >= MAX_BLANKS) {
            break;
          }
        }
      }
      
      // 선택된 빈칸을 스크립트에 적용하기 위해 뒤에서부터 순회
      selectedBlanks.reverse().forEach((match, blankIndex) => {
        const blankId = blankIndex + 1; // 1부터 순차적으로 ID 부여
        const blankPattern = `[____${blankId}____]`;
        processedText = processedText.substring(0, match.start) + 
          blankPattern + 
          processedText.substring(match.end);
        
        blanks.unshift({
          id: blankId,
          answer: '',
          isCorrect: false,
          showHint: false,
          originalWord: match.originalWord
        });
      });

      console.log('빈칸 생성 결과:', {
        원본텍스트: text,
        키워드: keywords,
        처리된텍스트: processedText,
        빈칸수: blanks.length,
        빈칸목록: blanks.map(b => ({ id: b.id, word: b.originalWord }))
      });
      
      setProcessedScript(processedText);
      setBlankAnswers(blanks.sort((a, b) => a.id - b.id));
    }
  }, [exerciseData]);

  // 정답 확인
  const checkAnswer = (blankId: number, userAnswer: string) => {
    const blank = blankAnswers.find(b => b.id === blankId);
    if (!blank) return;
    
    const isCorrect = userAnswer.toLowerCase() === blank.originalWord.toLowerCase();
    
    setBlankAnswers(prev => 
      prev.map(blank => 
        blank.id === blankId 
          ? { ...blank, answer: userAnswer, isCorrect }
          : blank
      )
    );
  };

  // 힌트 클릭 시 해당 빈칸 하이라이트 및 힌트 영역에 힌트 표시
  const showHint = (blankId: number) => {
    const blank = blankAnswers.find(b => b.id === blankId);
    if (!blank) return;
    
    setHighlightedBlank(blankId);
    
    // 랜덤으로 첫 번째 또는 두 번째 글자 힌트 생성
    let hintText = '';
    if (blank.originalWord.length <= 2) {
      hintText = `${blankId}번 힌트: ${blank.originalWord.length}글자 단어입니다.`;
    } else {
      // 랜덤으로 첫 번째 또는 두 번째 글자 선택
      const isFirstLetter = Math.random() < 0.5;
      const letterIndex = isFirstLetter ? 0 : 1;
      const positionText = isFirstLetter ? '첫 번째' : '두 번째';
      
      hintText = `${blankId}번 힌트: ${blank.originalWord.length}글자 단어이고, ${positionText} 글자는 "${blank.originalWord.charAt(letterIndex)}"입니다.`;
    }
    
    setHintContent(hintText);
    // 5초 후 하이라이트 제거
    setTimeout(() => {
      setHighlightedBlank(null);
      setHintContent('');
    }, 5000);
  };

  // 정답률 계산
  useEffect(() => {
    const correctCount = blankAnswers.filter(blank => blank.isCorrect).length;
    const totalCount = blankAnswers.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    setCurrentScore(score);
  }, [blankAnswers]);

  // 완료 처리
  const handleComplete = () => {
    setIsCompleted(true);
    onComplete(currentScore);
  };

  // 전체 정답 보기/숨기기
  const toggleAllAnswers = () => {
    setShowAllAnswers(!showAllAnswers);
  };

  return (
    <div className="container">
      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {/* 홈으로 버튼 */}
        <button onClick={onGoHome} className="home-btn">
          <span>🏠</span>
          <span>홈으로</span>
        </button>
        
        {/* 헤더 */}
        <div className="header">
          <h1>🧠 통역 메모리 훈련</h1>
          <p>2단계: 빈칸 채우기</p>
        </div>
        
        {/* 단계 표시기 */}
        <div className="step-indicator">
          <div className="step inactive">1</div>
          <div className="step active">2</div>
          <div className="step inactive">3</div>
          <div className="step inactive">4</div>
        </div>

        {/* 이전 단계 버튼 */}
        <div className="navigation-buttons">
          <button onClick={onPrevious} className="nav-btn prev">
            ⬅️ 이전 단계
          </button>
        </div>

        {/* 정답률 표시 */}
        <div className="score-display">
          <div className="score-box">
            <span className="score-label">정답률</span>
            <span className="score-value">{currentScore}%</span>
          </div>
        </div>

        {/* 빈칸 채우기 영역 */}
        <div className="blank-fill-area">
          <div className="script-content">
                         {processedScript.split(/(____\d+____)/).map((part, index) => {
               const blankMatch = part.match(/____(\d+)____/);
                              if (blankMatch) {
                 const blankId = parseInt(blankMatch[1]);
                 const blank = blankAnswers.find(b => b.id === blankId);
                
                                 return (
                   <span key={`blank-${blankId}-${index}`} className="blank-container">
                                          <input
                        type="text"
                        className={`blank-input ${blank?.isCorrect ? 'correct' : blank?.answer ? 'incorrect' : ''} ${highlightedBlank === blankId ? 'highlighted' : ''}`}
                        placeholder="정답 입력"
                        value={blank?.answer || ''}
                        onChange={(e) => checkAnswer(blankId, e.target.value)}
                        disabled={isCompleted}
                      />
                     {showAllAnswers && (
                       <span className="answer-text">
                         정답: {blank?.originalWord}
                       </span>
                     )}
                   </span>
                 );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>
        </div>

                 {/* 힌트 영역 */}
         <div className="hint-area">
           <h4>
             💡 힌트 보기
             <button
               onClick={toggleAllAnswers}
               style={{
                 background: '#f59e0b',
                 color: 'white',
                 border: 'none',
                 borderRadius: '4px',
                 padding: '4px 8px',
                 fontSize: '12px',
                 cursor: 'pointer',
                 marginLeft: '8px'
               }}
             >
               {showAllAnswers ? '정답 숨기기' : '전체 정답 보기'}
             </button>
           </h4>
                       {/* 힌트 내용 표시 영역 */}
            {hintContent && (
              <div className="hint-content">
                <p>{hintContent}</p>
              </div>
            )}
            
            <div className="hint-list">
              {blankAnswers.map((blank, index) => {
                return (
                  <button
                    key={blank.id}
                    className="hint-item"
                    onClick={() => showHint(blank.id)}
                    disabled={isCompleted}
                  >
                    <strong>{blank.id}번</strong>
                  </button>
                );
              })}
            </div>
         </div>

        {/* 컨트롤 버튼들 */}
        <div className="control-buttons">
          {!isCompleted && (
            <button
              onClick={handleComplete}
              className="control-btn complete"
              disabled={blankAnswers.some(blank => !blank.answer)}
            >
              완료하기
            </button>
          )}
          
          {isCompleted && (
            <button 
              onClick={() => onComplete(currentScore)}
              className="control-btn next"
            >
              ➡️ 3단계로 이동
            </button>
          )}
        </div>
      </div>
      
      {/* 사이드바 */}
      <div className="sidebar">
        <div className="guide-panel">
          {/* 헤더 */}
          <div className="guide-header">
            <span style={{fontSize: '1.5rem'}}>🧠</span>
            <h3>빈칸 채우기 가이드</h3>
          </div>
          
          {/* 훈련 목적 */}
          <div className="purpose-section">
            <div className="section-title">훈련 목적</div>
            <div className="purpose-box">
              <p>핵심 키워드를 기억하여 <strong>정보 재구성 능력</strong>을 향상시킵니다.</p>
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
              <div className="methodology-item"><strong>키워드 추출:</strong> 핵심 정보를 식별</div>
              <div className="methodology-item"><strong>연상 기법:</strong> 문맥을 통해 답 유추</div>
              <div className="methodology-item"><strong>정확성:</strong> 정확한 단어 기억</div>
            </div>
          </div>
          
          {/* 학습 효과 */}
          <div className="effects-section">
            <div className="effects-header">
              <span style={{fontSize: '1.1rem'}}>🎯</span>
              <span className="effects-title">학습 효과</span>
            </div>
            <ul className="effects-list">
              <li>핵심 정보 식별 능력</li>
              <li>정확한 단어 기억력</li>
              <li>문맥 이해력 향상</li>
              <li>집중력 강화</li>
              <li>실전 통역 능력 향상</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecondStep; 