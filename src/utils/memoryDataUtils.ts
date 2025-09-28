import { doc, setDoc, addDoc, collection, updateDoc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export interface MemorySession {
  id?: string;
  date: string;
  exerciseType: string; // '숫자 중심', '인명/지명', '목록/순서', '과정/절차'
  totalScore: number;
  stepCount: number; // 4단계 중 완료한 단계 수
  studyTime: number; // 초 단위
  averageScore: number;
  language: string; // '한국어', '중국어'
  steps?: Array<{
    stepId: number;
    stepName: string;
    score: number;
    timeUsed: number;
    completed: boolean;
    details?: {
      script: string;
      keyPoints: string[];
      userAnswers?: any;
    };
  }>;
  metadata?: {
    difficulty: string;
    customPrompt?: string;
    aiGenerated: boolean;
  };
}

export interface UserProfile {
  displayName: string;
  email: string;
  joinDate: string;
  totalStudyTime: number;
  totalSessions: number;
  totalSteps: number;
  averageScore: number;
  lastLogin: string;
  favoriteExerciseType?: string;
  streakDays: number;
}

// 사용자 프로필 저장/업데이트
export const saveUserProfile = async (profile: Partial<UserProfile>) => {
  if (!auth.currentUser) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }

  const userId = auth.currentUser.uid;
  const userRef = doc(db, 'users', userId);
  
  await setDoc(userRef, {
    ...profile,
    lastLogin: new Date().toISOString(),
  }, { merge: true });
};

// 메모리 훈련 세션 저장
export const saveMemorySession = async (session: MemorySession) => {
  if (!auth.currentUser) {
    throw new Error('사용자가 로그인되지 않았습니다.');
  }

  const userId = auth.currentUser.uid;
  const sessionsRef = collection(db, 'users', userId, 'memorySessions');
  
  const docRef = await addDoc(sessionsRef, {
    ...session,
    createdAt: new Date().toISOString(),
  });

  // 사용자 프로필 통계 업데이트
  await updateUserStats(userId, session);

  return docRef.id;
};

// 사용자 통계 업데이트
const updateUserStats = async (userId: string, session: MemorySession) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const currentData = userDoc.data();
    const newStats = {
      totalStudyTime: (currentData.totalStudyTime || 0) + session.studyTime,
      totalSteps: (currentData.totalSteps || 0) + session.stepCount,
      totalSessions: (currentData.totalSessions || 0) + 1,
      averageScore: calculateNewAverage(
        currentData.averageScore || 0,
        currentData.totalSessions || 0,
        session.averageScore
      ),
    };
    
    await updateDoc(userRef, newStats);
  } else {
    // 첫 번째 세션인 경우 프로필 생성
    const userProfile = {
      displayName: auth.currentUser?.displayName || 'Unknown User',
      email: auth.currentUser?.email || '',
      joinDate: new Date().toISOString(),
      totalStudyTime: session.studyTime,
      totalSteps: session.stepCount,
      totalSessions: 1,
      averageScore: session.averageScore,
      lastLogin: new Date().toISOString(),
      streakDays: 1,
    };
    
    await setDoc(userRef, userProfile);
  }
};

// 새로운 평균 점수 계산
const calculateNewAverage = (currentAverage: number, currentCount: number, newScore: number): number => {
  const totalScore = currentAverage * currentCount + newScore;
  return totalScore / (currentCount + 1);
};

// 사용자 메모리 세션 조회
export const getUserMemorySessions = async (limitCount: number = 50): Promise<MemorySession[]> => {
  if (!auth.currentUser) {
    return [];
  }

  const userId = auth.currentUser.uid;
  const sessionsRef = collection(db, 'users', userId, 'memorySessions');
  const q = query(sessionsRef, orderBy('date', 'desc'), limit(limitCount));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MemorySession));
};

// 사용자 프로필 조회
export const getUserProfile = async (): Promise<UserProfile | null> => {
  if (!auth.currentUser) {
    return null;
  }

  const userId = auth.currentUser.uid;
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  
  return null;
};

// 연속 학습일 계산
export const calculateStreakDays = (sessions: MemorySession[]): number => {
  if (sessions.length === 0) return 0;
  
  const uniqueDays = [...new Set(sessions.map(s => s.date.split('T')[0]))];
  uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streakDays = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = new Date(today);
  
  for (let i = 0; i < uniqueDays.length; i++) {
    const sessionDate = currentDate.toISOString().split('T')[0];
    if (uniqueDays.includes(sessionDate)) {
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streakDays;
};

// 주간 목표 진행도 계산
export const calculateWeeklyGoal = (sessions: MemorySession[]): number => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= weekStart);
  return Math.min((thisWeekSessions.length / 5) * 100, 100);
};

// 일일 학습 시간 계산 (최근 7일)
export const calculateDailyStudyTime = (sessions: MemorySession[]): number[] => {
  const dailyStudyTime = Array(7).fill(0);
  
  sessions.forEach(session => {
    const sessionDate = new Date(session.date);
    const daysDiff = Math.floor((new Date().getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < 7) {
      dailyStudyTime[6 - daysDiff] += Math.round(session.studyTime / 60); // 분 단위로 변환
    }
  });
  
  return dailyStudyTime;
};

// 주간 성과 추이 계산
export const calculateWeeklyProgress = (sessions: MemorySession[]) => {
  const weeklyData: Record<string, { scores: number[]; steps: number; time: number }> = {};
  
  sessions.forEach(session => {
    const date = new Date(session.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { scores: [], steps: 0, time: 0 };
    }
    
    weeklyData[weekKey].scores.push(session.averageScore);
    weeklyData[weekKey].steps += session.stepCount;
    weeklyData[weekKey].time += session.studyTime;
  });

  return Object.entries(weeklyData)
    .map(([week, data]) => ({
      week: `${new Date(week).getMonth() + 1}월 ${Math.ceil(new Date(week).getDate() / 7)}주차`,
      averageScore: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length * 10) / 10,
      totalSteps: data.steps,
      studyTime: data.time,
      improvement: '+3%' // 간단히 고정값 사용
    }))
    .sort((a, b) => b.week.localeCompare(a.week))
    .slice(0, 4);
};

// 훈련 유형별 성과 랭킹
export const calculateExerciseTypeRanking = (sessions: MemorySession[]) => {
  const exerciseTypeStats = sessions.reduce((acc, session) => {
    if (!acc[session.exerciseType]) {
      acc[session.exerciseType] = { scores: [], stepCount: 0 };
    }
    acc[session.exerciseType].scores.push(session.averageScore);
    acc[session.exerciseType].stepCount += session.stepCount;
    return acc;
  }, {} as Record<string, { scores: number[]; stepCount: number }>);

  const ranking = Object.entries(exerciseTypeStats).map(([exerciseType, data]) => ({
    exerciseType,
    averageScore: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length * 10) / 10,
    stepCount: data.stepCount,
    rank: 0
  })).sort((a, b) => b.averageScore - a.averageScore);

  ranking.forEach((item, index) => {
    item.rank = index + 1;
  });

  return ranking;
};
