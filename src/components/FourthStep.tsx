import React, { useState, useRef, useEffect } from 'react';
import './FourthStep.css';

interface FourthStepProps {
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

interface AnalysisResult {
  keywordCoverage: number;
  structureSimilarity: number;
  contentCompleteness: number;
  languageFluency: number;
  overallScore: number;
  detailedFeedback: {
    matchedKeywords: string[];
    missedKeywords: string[];
    structureAnalysis: string;
    suggestions: string[];
    strengths: string[];
    improvements: string[];
  };
}

interface KeywordCheck {
  keyword: string;
  isIncluded: boolean;
  isManuallyChecked: boolean;
}

const FourthStep: React.FC<FourthStepProps> = ({ exerciseData, onComplete, onPrevious, onGoHome }) => {
  const [userText, setUserText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [keywordChecks, setKeywordChecks] = useState<KeywordCheck[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 키워드 체크리스트 초기화
  useEffect(() => {
    const checks: KeywordCheck[] = exerciseData.keyPoints.map(keyword => ({
      keyword,
      isIncluded: false,
      isManuallyChecked: false
    }));
    setKeywordChecks(checks);
  }, [exerciseData.keyPoints]);

  // 실시간 키워드 체크
  useEffect(() => {
    if (userText) {
      setKeywordChecks(prev => prev.map(check => ({
        ...check,
        isIncluded: userText.toLowerCase().includes(check.keyword.toLowerCase())
      })));
    }
  }, [userText]);

  // 키워드 수동 체크 토글
  const toggleKeywordCheck = (index: number) => {
    setKeywordChecks(prev => prev.map((check, i) => 
      i === index 
        ? { ...check, isManuallyChecked: !check.isManuallyChecked }
        : check
    ));
  };

  // 로컬 분석 함수
  const analyzeTextLocally = (userText: string, originalScript: string, keyPoints: string[]) => {
    // 1. 키워드 포함률
    const matchedKeywords = keyPoints.filter(keyword => 
      userText.toLowerCase().includes(keyword.toLowerCase())
    );
    const keywordCoverage = (matchedKeywords.length / keyPoints.length) * 100;

    // 2. 구조 유사도 (길이, 문장 수 기반)
    const lengthRatio = Math.min(userText.length / originalScript.length, 1.2);
    const userSentences = userText.split(/[.!?]/).filter(s => s.trim().length > 0);
    const originalSentences = originalScript.split(/[.!?]/).filter(s => s.trim().length > 0);
    const sentenceRatio = Math.min(userSentences.length / originalSentences.length, 1.2);
    const structureSimilarity = (lengthRatio * 0.7 + sentenceRatio * 0.3) * 80;

    // 3. 내용 완성도
    const contentCompleteness = keywordCoverage * 0.6 + structureSimilarity * 0.4;

    // 4. 언어 유창성 (기본 규칙 체크)
    const hasProperPunctuation = /[.!?]/.test(userText);
    const hasReasonableLength = userText.length >= 50;
    const hasVariedSentences = userSentences.length >= 3;
    const languageFluency = (
      (hasProperPunctuation ? 30 : 0) +
      (hasReasonableLength ? 35 : 0) +
      (hasVariedSentences ? 35 : 0)
    );

    const overallScore = (keywordCoverage + structureSimilarity + contentCompleteness + languageFluency) / 4;
    const missedKeywords = keyPoints.filter(keyword => !matchedKeywords.includes(keyword));

    return {
      keywordCoverage: Math.round(keywordCoverage),
      structureSimilarity: Math.round(structureSimilarity),
      contentCompleteness: Math.round(contentCompleteness),
      languageFluency: Math.round(languageFluency),
      overallScore: Math.round(overallScore),
      detailedFeedback: {
        matchedKeywords,
        missedKeywords,
        structureAnalysis: `텍스트 길이: ${userText.length}자, 원본 대비 ${Math.round(lengthRatio * 100)}%, 문장 수: ${userSentences.length}개`,
        suggestions: [
          missedKeywords.length > 0 ? `누락된 키워드 포함: ${missedKeywords.slice(0, 3).join(', ')}` : '핵심 키워드가 잘 포함되었습니다',
          userText.length < 100 ? '더 자세한 설명을 추가해보세요' : '적절한 길이입니다',
          '논리적 순서를 확인해보세요',
          '문장 간 연결어를 활용해보세요',
          '구두점을 적절히 사용해보세요'
        ],
        strengths: [
          matchedKeywords.length > 0 ? '핵심 키워드를 잘 기억했습니다' : '전체적인 구조를 파악했습니다',
          '적극적으로 내용을 재생산했습니다',
          hasProperPunctuation ? '적절한 구두점을 사용했습니다' : '문장 구조가 다양합니다'
        ],
        improvements: [
          missedKeywords.length > 0 ? '누락된 키워드들을 추가해보세요' : '문장 구조를 다양화해보세요',
          '더 구체적인 표현을 사용해보세요',
          !hasProperPunctuation ? '구두점을 적절히 사용해보세요' : '문장 간 연결을 자연스럽게 해보세요'
        ]
      }
    };
  };

  // 분석 함수
  const analyzeText = () => {
    if (!userText.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }

    if (userText.trim().length < 50) {
      alert('최소 50자 이상 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysisData = analyzeTextLocally(userText, exerciseData.script, exerciseData.keyPoints);
      setAnalysisResult(analysisData);
      setAnalysisHistory(prev => [...prev, analysisData]);
    } catch (error) {
      console.error('분석 실패:', error);
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };



  // 텍스트 클리어
  const clearText = () => {
    setUserText('');
    setAnalysisResult(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 완료 처리
  const handleComplete = () => {
    if (!analysisResult) {
      alert('먼저 분석을 진행해주세요.');
      return;
    }
    
    setIsCompleted(true);
    onComplete(analysisResult.overallScore);
  };

  // 점수에 따른 색상 반환
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // 초록색
    if (score >= 60) return '#f59e0b'; // 주황색
    return '#ef4444'; // 빨간색
  };

  // 점수에 따른 등급 반환
  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
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
          <p>4단계: 스토리 재생산</p>
        </div>
        
        {/* 단계 표시기 */}
        <div className="step-indicator">
          <div className="step completed">✓</div>
          <div className="step completed">✓</div>
          <div className="step completed">✓</div>
          <div className="step active">4</div>
        </div>

        {/* 이전 단계 버튼 */}
        <div className="navigation-buttons">
          <button onClick={onPrevious} className="nav-btn prev">
            ⬅️ 이전 단계
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="instruction-box">
          <h3>✍️ 기억한 내용을 자신의 말로 재생산해주세요</h3>
          <p>앞서 학습한 내용을 바탕으로 완전한 스토리를 작성하세요. 핵심 키워드들을 포함하여 논리적으로 구성해주세요.</p>
        </div>

        {/* 텍스트 입력 영역 */}
        <div className="text-input-area">
          <div className="input-header">
            <label>📝 스토리 작성</label>
            <div className="char-counter">
              <span className={userText.length < 50 ? 'insufficient' : 'sufficient'}>
                {userText.length} / 1000자
              </span>
              {userText.length < 50 && <span className="min-notice">(최소 50자)</span>}
            </div>
          </div>
          
          <textarea
            ref={textareaRef}
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder="여기에 기억한 내용을 자신의 말로 작성해주세요...&#10;&#10;예시:&#10;- 핵심 키워드들을 포함하여 작성&#10;- 논리적인 순서로 구성&#10;- 완전한 문장으로 표현"
            className="story-textarea"
            maxLength={1000}
            disabled={isCompleted}
          />
        </div>

        {/* 키워드 체크리스트 */}
        <div className="keyword-checklist">
          <h4>✅ 핵심 키워드 체크리스트</h4>
          <div className="keyword-grid">
            {keywordChecks.map((check, index) => (
              <div 
                key={index} 
                className={`keyword-item ${check.isIncluded ? 'auto-checked' : ''} ${check.isManuallyChecked ? 'manually-checked' : ''}`}
                onClick={() => toggleKeywordCheck(index)}
              >
                <span className="keyword-checkbox">
                  {check.isIncluded ? '✅' : check.isManuallyChecked ? '☑️' : '⬜'}
                </span>
                <span className="keyword-text">{check.keyword}</span>
                {check.isIncluded && <span className="auto-detected">자동 감지</span>}
              </div>
            ))}
          </div>
          <div className="keyword-summary">
            포함된 키워드: {keywordChecks.filter(k => k.isIncluded || k.isManuallyChecked).length} / {keywordChecks.length}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="action-buttons">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="action-btn secondary"
          >
            {showOriginal ? '원본 숨기기' : '📄 원본 보기'}
          </button>
          
          <button
            onClick={clearText}
            className="action-btn danger"
            disabled={isCompleted}
          >
            🗑️ 초기화
          </button>
          
          <button
            onClick={analyzeText}
            disabled={!userText.trim() || userText.length < 50 || isAnalyzing || isCompleted}
            className="action-btn primary"
          >
            {isAnalyzing ? '🔄 분석 중...' : '🔍 분석하기'}
          </button>
        </div>

        {/* 원본 스크립트 */}
        {showOriginal && (
          <div className="original-script">
            <h4>📄 원본 스크립트 (참고용)</h4>
            <div className="script-content">
              {exerciseData.script}
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisResult && (
          <div className="analysis-results">
            <h3>📊 분석 결과</h3>
            
            {/* 종합 점수 */}
            <div className="overall-score">
              <div className="score-circle" style={{ borderColor: getScoreColor(analysisResult.overallScore) }}>
                <div className="score-number" style={{ color: getScoreColor(analysisResult.overallScore) }}>
                  {analysisResult.overallScore}
                </div>
                <div className="score-label">종합 점수</div>
                <div className="score-grade" style={{ color: getScoreColor(analysisResult.overallScore) }}>
                  {getGrade(analysisResult.overallScore)}
                </div>
              </div>
            </div>

            {/* 세부 점수 */}
            <div className="detailed-scores">
              <div className="score-item">
                <div className="score-label">키워드 포함률</div>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ 
                      width: `${analysisResult.keywordCoverage}%`,
                      backgroundColor: getScoreColor(analysisResult.keywordCoverage)
                    }}
                  ></div>
                </div>
                <div className="score-value">{analysisResult.keywordCoverage}%</div>
              </div>

              <div className="score-item">
                <div className="score-label">구조 유사도</div>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ 
                      width: `${analysisResult.structureSimilarity}%`,
                      backgroundColor: getScoreColor(analysisResult.structureSimilarity)
                    }}
                  ></div>
                </div>
                <div className="score-value">{analysisResult.structureSimilarity}%</div>
              </div>

              <div className="score-item">
                <div className="score-label">내용 완성도</div>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ 
                      width: `${analysisResult.contentCompleteness}%`,
                      backgroundColor: getScoreColor(analysisResult.contentCompleteness)
                    }}
                  ></div>
                </div>
                <div className="score-value">{analysisResult.contentCompleteness}%</div>
              </div>

              <div className="score-item">
                <div className="score-label">언어 유창성</div>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ 
                      width: `${analysisResult.languageFluency}%`,
                      backgroundColor: getScoreColor(analysisResult.languageFluency)
                    }}
                  ></div>
                </div>
                <div className="score-value">{analysisResult.languageFluency}%</div>
              </div>
            </div>

            {/* 상세 피드백 */}
            <div className="detailed-feedback">
              <div className="feedback-section strengths">
                <h4>👍 잘한 점</h4>
                <ul>
                  {analysisResult.detailedFeedback.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div className="feedback-section improvements">
                <h4>📈 개선할 점</h4>
                <ul>
                  {analysisResult.detailedFeedback.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>

              <div className="feedback-section suggestions">
                <h4>💡 개선 제안</h4>
                <ul>
                  {analysisResult.detailedFeedback.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              <div className="feedback-section keywords">
                <div className="keyword-analysis">
                  <div className="matched-keywords">
                    <h5>✅ 포함된 키워드</h5>
                    <div className="keyword-tags">
                      {analysisResult.detailedFeedback.matchedKeywords.length > 0 ? 
                        analysisResult.detailedFeedback.matchedKeywords.map((keyword, index) => (
                          <span key={index} className="keyword-tag matched">{keyword}</span>
                        )) : 
                        <span className="no-keywords">없음</span>
                      }
                    </div>
                  </div>

                  <div className="missed-keywords">
                    <h5>❌ 누락된 키워드</h5>
                    <div className="keyword-tags">
                      {analysisResult.detailedFeedback.missedKeywords.length > 0 ? 
                        analysisResult.detailedFeedback.missedKeywords.map((keyword, index) => (
                          <span key={index} className="keyword-tag missed">{keyword}</span>
                        )) : 
                        <span className="no-keywords">없음</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 완료 버튼 */}
        <div className="completion-section">
          {!isCompleted && analysisResult && (
            <button
              onClick={handleComplete}
              className="completion-btn"
            >
              🎉 훈련 완료
            </button>
          )}
          
          {isCompleted && (
            <div className="completion-message">
              <h3>🎉 메모리 훈련이 완료되었습니다!</h3>
              <p>최종 점수: <strong>{analysisResult?.overallScore || 0}점</strong></p>
              <button 
                onClick={() => window.location.reload()}
                className="restart-btn"
              >
                🔄 다시 도전하기
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 사이드바 */}
      <div className="sidebar">
        <div className="guide-panel">
          {/* 헤더 */}
          <div className="guide-header">
            <span style={{fontSize: '1.5rem'}}>🧠</span>
            <h3>스토리 재생산 가이드</h3>
          </div>
          
          {/* 훈련 목적 */}
          <div className="purpose-section">
            <div className="section-title">훈련 목적</div>
            <div className="purpose-box">
              <p>학습한 내용을 <strong>완전히 재생산</strong>하여 종합적인 통역 능력을 평가합니다.</p>
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
            
            <div className="step-item">
              <div className="step-item-header">
                <span className="step-number green">✓</span>
                <span className="step-name">문장재배열</span>
              </div>
              <div className="step-desc">논리적 순서 재구성</div>
            </div>
            
            <div className="step-item current">
              <div className="step-item-header">
                <span className="step-number purple">4</span>
                <span className="step-name">스토리재생산</span>
              </div>
              <div className="step-desc">완전한 내용 복원</div>
            </div>
          </div>
          
          {/* 평가 기준 */}
          <div className="evaluation-section">
            <div className="section-title">평가 기준</div>
            <div className="evaluation-content">
              <div className="evaluation-item">
                <div className="eval-label">키워드 포함률</div>
                <div className="eval-desc">핵심 키워드 포함 정도</div>
              </div>
              <div className="evaluation-item">
                <div className="eval-label">구조 유사도</div>
                <div className="eval-desc">원본과 논리적 흐름 유사성</div>
              </div>
              <div className="evaluation-item">
                <div className="eval-label">내용 완성도</div>
                <div className="eval-desc">핵심 내용 포함 정도</div>
              </div>
              <div className="evaluation-item">
                <div className="eval-label">언어 유창성</div>
                <div className="eval-desc">문법과 표현의 자연스러움</div>
              </div>
            </div>
          </div>
          
          {/* 작성 팁 */}
          <div className="tips-section">
            <div className="tips-header">
              <span style={{fontSize: '1.1rem'}}>💡</span>
              <span className="tips-title">작성 팁</span>
            </div>
            <ul className="tips-list">
              <li>핵심 키워드를 모두 포함하세요</li>
              <li>논리적 순서로 구성하세요</li>
              <li>완전한 문장으로 작성하세요</li>
              <li>원문의 핵심 의미를 담으세요</li>
              <li>자연스러운 표현을 사용하세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FourthStep; 