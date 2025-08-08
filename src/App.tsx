import React, { useState } from 'react';
import FirstStep from './components/FirstStep';
import SecondStep from './components/SecondStep';
import ThirdStep from './components/ThirdStep';
import FourthStep from './components/FourthStep';
import './App.css';

interface ExerciseData {
  script: string;
  keyPoints: string[];
  title: string;
  duration: number;
  category: string;
  type: string;
}

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);

  // 1단계에서 2단계로 이동
  const handleFirstStepComplete = (data: ExerciseData) => {
    setExerciseData(data);
    setCurrentStep(2);
  };

  // 2단계에서 1단계로 돌아가기
  const handleSecondStepPrevious = () => {
    setCurrentStep(1);
  };

  // 2단계 완료 처리
  const handleSecondStepComplete = (score: number) => {
    console.log('2단계 완료! 점수:', score);
    setCurrentStep(3); // 3단계로 이동
  };

  // 3단계에서 2단계로 돌아가기
  const handleThirdStepPrevious = () => {
    setCurrentStep(2);
  };

  // 3단계 완료 처리
  const handleThirdStepComplete = (score: number) => {
    console.log('3단계 완료! 점수:', score);
    setCurrentStep(4);
  };

  // 4단계에서 3단계로 돌아가기
  const handleFourthStepPrevious = () => {
    setCurrentStep(3);
  };

  // 4단계 완료 처리 (전체 훈련 완료)
  const handleFourthStepComplete = (score: number) => {
    console.log('전체 훈련 완료! 최종 점수:', score);
    // 여기서 결과 저장, 통계 업데이트 등 처리
    alert(`🎉 메모리 훈련이 완료되었습니다!\n최종 점수: ${score}점`);
  };

  // 홈으로 돌아가기
  const handleGoHome = () => {
    setCurrentStep(1);
    setExerciseData(null); // 데이터 초기화
  };

  return (
    <div className="App">
      {currentStep === 1 && (
        <FirstStep onComplete={handleFirstStepComplete} onGoHome={handleGoHome} />
      )}
      {currentStep === 2 && exerciseData && (
        <SecondStep 
          exerciseData={exerciseData}
          onComplete={handleSecondStepComplete}
          onPrevious={handleSecondStepPrevious}
          onGoHome={handleGoHome}
        />
      )}
      {currentStep === 3 && exerciseData && (
        <ThirdStep 
          exerciseData={exerciseData}
          onComplete={handleThirdStepComplete}
          onPrevious={handleThirdStepPrevious}
          onGoHome={handleGoHome}
        />
      )}
      {currentStep === 4 && exerciseData && (
        <FourthStep 
          exerciseData={exerciseData}
          onComplete={handleFourthStepComplete}
          onPrevious={handleFourthStepPrevious}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}

export default App;
