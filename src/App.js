"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const FirstStep_1 = __importDefault(require("./components/FirstStep"));
const SecondStep_1 = __importDefault(require("./components/SecondStep"));
const ThirdStep_1 = __importDefault(require("./components/ThirdStep"));
const FourthStep_1 = __importDefault(require("./components/FourthStep"));
require("./App.css");
function App() {
    const [currentStep, setCurrentStep] = (0, react_1.useState)(1);
    const [exerciseData, setExerciseData] = (0, react_1.useState)(null);
    // 1단계에서 2단계로 이동
    const handleFirstStepComplete = (data) => {
        setExerciseData(data);
        setCurrentStep(2);
    };
    // 2단계에서 1단계로 돌아가기
    const handleSecondStepPrevious = () => {
        setCurrentStep(1);
    };
    // 2단계 완료 처리
    const handleSecondStepComplete = (score) => {
        console.log('2단계 완료! 점수:', score);
        setCurrentStep(3); // 3단계로 이동
    };
    // 3단계에서 2단계로 돌아가기
    const handleThirdStepPrevious = () => {
        setCurrentStep(2);
    };
    // 3단계 완료 처리
    const handleThirdStepComplete = (score) => {
        console.log('3단계 완료! 점수:', score);
        setCurrentStep(4);
    };
    // 4단계에서 3단계로 돌아가기
    const handleFourthStepPrevious = () => {
        setCurrentStep(3);
    };
    // 4단계 완료 처리 (전체 훈련 완료)
    const handleFourthStepComplete = (score) => {
        console.log('전체 훈련 완료! 최종 점수:', score);
        // 여기서 결과 저장, 통계 업데이트 등 처리
        alert(`🎉 메모리 훈련이 완료되었습니다!\n최종 점수: ${score}점`);
    };
    // 홈으로 돌아가기
    const handleGoHome = () => {
        setCurrentStep(1);
        setExerciseData(null); // 데이터 초기화
    };
    return (<div className="App">
      {currentStep === 1 && (<FirstStep_1.default onComplete={handleFirstStepComplete} onGoHome={handleGoHome}/>)}
      {currentStep === 2 && exerciseData && (<SecondStep_1.default exerciseData={exerciseData} onComplete={handleSecondStepComplete} onPrevious={handleSecondStepPrevious} onGoHome={handleGoHome}/>)}
      {currentStep === 3 && exerciseData && (<ThirdStep_1.default exerciseData={exerciseData} onComplete={handleThirdStepComplete} onPrevious={handleThirdStepPrevious} onGoHome={handleGoHome}/>)}
      {currentStep === 4 && exerciseData && (<FourthStep_1.default exerciseData={exerciseData} onComplete={handleFourthStepComplete} onPrevious={handleFourthStepPrevious} onGoHome={handleGoHome}/>)}
    </div>);
}
exports.default = App;
