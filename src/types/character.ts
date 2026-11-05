// 기숙사·지팡이·인물 프로필과 화면 설정이 공유하는 데이터 계약을 정의한다.
// 기숙사·지팡이·인물 프로필과 화면 설정이 공유하는 데이터 계약을 정의한다.
export type HouseType = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff';

export interface WandInfo {
  wood: string;
  core: string;
  length: string;
  flexibility: string;
}

export interface Character {
  id: string;
  nameKo: string;
  nameEn: string;
  house: HouseType;
  gender: string;
  age: number;
  height?: number;
  weight?: number;
  year: number; // 1-7
  birthday: string;
  bloodStatus: '순수혈통' | '혼혈' | '머글태생';
  wand: WandInfo;
  patronus: string;
  boggart: string;
  portraitCrop?: { zoom: number; x: number; y: number };
  image: string; // PNG path or data URL
  appearanceSummary: string;
  appearanceDetail: string;
  personality: string[];
  personalityDetail: string;
  background: string;
  quote: string;
  specialty: string;
  positionOrClub?: string;
  trivia: string[];
  createdAt: number;
}

export interface HouseConfig {
  id: HouseType;
  nameKo: string;
  nameEn: string;
  animal: string;
  values: string[];
  motto: string;
  founder: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bgGlow: string;
    border: string;
    gradient: string;
  };
}
