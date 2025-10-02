import React, { useState, useEffect } from 'react';
import './ThirdStep.css';

interface ThirdStepProps {
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

interface Sentence {
  id: number;
  text: string;
  originalOrder: number;
}

interface DropZone {
  id: number;
  sentence: Sentence | null;
  isCorrect: boolean;
}

const ThirdStep: React.FC<ThirdStepProps> = ({ exerciseData, onComplete, onPrevious, onGoHome }) => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [draggedSentence, setDraggedSentence] = useState<Sentence | null>(null);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [dragOverZone, setDragOverZone] = useState<number | null>(null);

  // 문장 분리 및 초기화
  useEffect(() => {
    if (exerciseData.script) {
      // 문장 분리 (마침표 기준, 숫자 사이 점 제외)
      const sentenceArray = exerciseData.script
        .split(/(?<!\d)\.(?!\d)|。/)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim())
        .filter(s => s.length >= 5); // 너무 짧은 조각 제외

      // 원본 순서와 섞인 순서 생성
      const originalSentences: Sentence[] = sentenceArray.map((text, index) => ({
        id: index + 1,
        text: text,
        originalOrder: index + 1
      }));

      // 문장들을 섞기
      const shuffledSentences = [...originalSentences].sort(() => Math.random() - 0.5);
      
      // 드롭 존 초기화
      const zones: DropZone[] = originalSentences.map((_, index) => ({
        id: index + 1,
        sentence: null,
        isCorrect: false
      }));

      setSentences(shuffledSentences);
      setDropZones(zones);
    }
  }, [exerciseData]);

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, sentence: Sentence) => {
    setDraggedSentence(sentence);
    e.dataTransfer.setData('text/plain', JSON.stringify(sentence));
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, zoneId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone(zoneId);
  };

  // 드래그 리브
  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, zoneId: number) => {
    e.preventDefault();
    setDragOverZone(null);
    
    const sentenceData = e.dataTransfer.getData('text/plain');
    if (sentenceData && draggedSentence) {
      const sentence = JSON.parse(sentenceData) as Sentence;
      
      // 기존에 다른 존에 있었다면 제거
      const updatedZones = dropZones.map(zone => 
        zone.sentence?.id === sentence.id ? { ...zone, sentence: null, isCorrect: false } : zone
      );
      
      // 새 위치에 배치
      const newZones = updatedZones.map(zone => 
        zone.id === zoneId 
          ? { 
              ...zone, 
              sentence: sentence, 
              isCorrect: sentence.originalOrder === zoneId 
            }
          : zone
      );
      
      setDropZones(newZones);
      
      // 드래그 소스에서 제거
      setSentences(prev => prev.filter(s => s.id !== sentence.id));
    }
    
    setDraggedSentence(null);
  };

  // 드롭 존에서 문장 제거
  const removeSentenceFromZone = (zoneId: number) => {
    const zone = dropZones.find(z => z.id === zoneId);
    if (zone?.sentence) {
      // 드래그 소스로 다시 추가
      setSentences(prev => [...prev, zone.sentence!]);
      
      // 드롭 존에서 제거
      setDropZones(prev => prev.map(z => 
        z.id === zoneId ? { ...z, sentence: null, isCorrect: false } : z
      ));
    }
  };

  // 점수 계산
  useEffect(() => {
    const totalZones = dropZones.length;
    const correctZones = dropZones.filter(zone => zone.isCorrect).length;
    const score = totalZones > 0 ? Math.round((correctZones / totalZones) * 100) : 0;
    setCurrentScore(score);
  }, [dropZones]);

  // 모든 문장 재섞기
  const reshuffleSentences = () => {
    // 모든 문장을 드래그 소스로 이동
    const allSentences: Sentence[] = [];
    
    dropZones.forEach(zone => {
      if (zone.sentence) {
        allSentences.push(zone.sentence);
      }
    });
    
    sentences.forEach(sentence => {
      allSentences.push(sentence);
    });
    
    // 섞기
    const shuffled = allSentences.sort(() => Math.random() - 0.5);
    
    setSentences(shuffled);
    setDropZones(prev => prev.map(zone => ({ ...zone, sentence: null, isCorrect: false })));
  };

  // 완료 처리
  const handleComplete = () => {
    setIsCompleted(true);
    onComplete(currentScore);
  };

  return (
    <div className="container">
      {/* 메인 콘텐츠와 사이드바 래퍼 */}
      <div className="content-wrapper">
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
          <p>3단계: 문장 재배열</p>
        </div>
        
        {/* 단계 표시기 */}
        <div className="step-indicator">
          <div className="step completed">✓</div>
          <div className="step completed">✓</div>
          <div className="step active">3</div>
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
            <span className="score-label">정확도</span>
            <span className="score-value">{currentScore}%</span>
          </div>
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="control-buttons">
          <button
            onClick={() => setShowHints(!showHints)}
            className="control-btn hint"
          >
            💡 {showHints ? '힌트 숨기기' : '힌트 보기'}
          </button>
          <button
            onClick={() => setShowAllAnswers(!showAllAnswers)}
            className="control-btn answer"
          >
            📝 {showAllAnswers ? '정답 숨기기' : '정답 보기'}
          </button>
          <button
            onClick={reshuffleSentences}
            className="control-btn shuffle"
          >
            🔄 다시 섞기
          </button>
        </div>

        {/* 드래그 소스 영역 */}
        <div className="drag-source-area">
          <h3>📦 섞인 문장들 (아래로 드래그하세요)</h3>
          <div className="sentences-container">
            {sentences.map((sentence) => (
              <div
                key={sentence.id}
                className="sentence-item draggable"
                draggable
                onDragStart={(e) => handleDragStart(e, sentence)}
              >
                <span className="drag-handle">⋮⋮</span>
                <span className="sentence-text">{sentence.text}</span>
              </div>
            ))}
            {sentences.length === 0 && (
              <div className="empty-message">
                모든 문장이 배치되었습니다
              </div>
            )}
          </div>
        </div>

        {/* 드롭 존 영역 */}
        <div className="drop-zones-area">
          <h3>🎯 올바른 순서로 배치하세요</h3>
          <div className="drop-zones-container">
            {dropZones.map((zone) => (
              <div
                key={zone.id}
                className={`drop-zone ${zone.sentence ? (zone.isCorrect ? 'correct' : 'incorrect') : ''} ${dragOverZone === zone.id ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, zone.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, zone.id)}
              >
                <div className="zone-header">
                  <span className={`zone-number ${zone.isCorrect ? 'correct' : zone.sentence ? 'incorrect' : ''}`}>
                    {zone.isCorrect ? '✓' : zone.id}
                  </span>
                  {zone.sentence && (
                    <button
                      className="remove-btn"
                      onClick={() => removeSentenceFromZone(zone.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {zone.sentence ? (
                  <div className="zone-content">
                    <span className="zone-sentence">{zone.sentence.text}</span>
                    {zone.isCorrect && <span className="correct-indicator">✓ 정답!</span>}
                    {!zone.isCorrect && <span className="incorrect-indicator">✗ 틀림</span>}
                  </div>
                ) : (
                  <div className="zone-placeholder">
                    여기에 {zone.id}번째 문장을 드래그하세요
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 힌트 영역 */}
        {showHints && (
          <div className="hints-area">
            <h4>💡 재배열 힌트</h4>
            <ul>
              <li>• 시간순서나 논리적 흐름을 고려하세요</li>
              <li>• 원인과 결과의 관계를 파악하세요</li>
              <li>• 도입-전개-결론 구조를 생각해보세요</li>
            </ul>
          </div>
        )}

        {/* 정답 영역 */}
        {showAllAnswers && (
          <div className="answers-area">
            <h4>📝 정답 순서</h4>
            <div className="answer-list">
              {dropZones.map((zone) => {
                const originalSentence = exerciseData.script
                  .split(/[.!?。！？]/)
                  .filter(s => s.trim().length > 0)[zone.id - 1]?.trim();
                
                return (
                  <div key={zone.id} className="answer-item">
                    <span className="answer-number">{zone.id}</span>
                    <span className="answer-text">{originalSentence}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 완료 버튼 */}
        <div className="completion-buttons">
          {!isCompleted && (
            <button
              onClick={handleComplete}
              className="control-btn complete"
            >
              완료하기
            </button>
          )}
          
          {isCompleted && (
            <button 
              onClick={() => onComplete(currentScore)}
              className="control-btn next"
            >
              ➡️ 4단계로 이동
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
            <h3>문장 재배열 가이드</h3>
          </div>
          
          {/* 훈련 목적 */}
          <div className="purpose-section">
            <div className="section-title">훈련 목적</div>
            <div className="purpose-box">
              <p>논리적 순서와 <strong>정보 구조화 능력</strong>을 향상시킵니다.</p>
            </div>
          </div>
          
          {/* 학습 단계 */}
          <div className="steps-section">
            <div className="section-title">학습 단계</div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number blue">✓</span>
                <span className="step-name">타이머학습</span>
              </div>
              <div className="step-desc">집중해서 내용 기억</div>
            </div>
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number orange">✓</span>
                <span className="step-name">빈칸채우기</span>
              </div>
              <div className="step-desc">핵심 단어 기억 테스트</div>
            </div>
            
            <div className="step-item current">
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
              <div className="methodology-item"><strong>순서 인식:</strong> 논리적 흐름 파악</div>
              <div className="methodology-item"><strong>구조화:</strong> 정보의 계층 구조 이해</div>
              <div className="methodology-item"><strong>연결성:</strong> 문장 간 관계 분석</div>
            </div>
          </div>
          
          {/* 학습 효과 */}
          <div className="effects-section">
            <div className="effects-header">
              <span style={{fontSize: '1.1rem'}}>🎯</span>
              <span className="effects-title">학습 효과</span>
            </div>
            <ul className="effects-list">
              <li>논리적 사고력 향상</li>
              <li>정보 구조화 능력</li>
              <li>순서 인식 능력</li>
              <li>문맥 이해력 강화</li>
              <li>실전 통역 능력 향상</li>
            </ul>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ThirdStep; 