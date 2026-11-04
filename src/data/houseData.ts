import { HouseConfig, HouseType } from '../types/character';

export const HOUSES: Record<HouseType, HouseConfig> = {
  gryffindor: {
    id: 'gryffindor',
    nameKo: '그리핀도르',
    nameEn: 'Gryffindor',
    animal: '사자 (Lion)',
    values: ['용기', '대담함', '기사도', '정의'],
    motto: 'Forti animo et virtute (굳센 마음과 용기로)',
    founder: '고드릭 그리핀도르 (Godric Gryffindor)',
    colors: {
      primary: '#991b1b', // rich deep scarlet
      secondary: '#d97706', // warm gold
      accent: '#f59e0b',
      bgGlow: 'rgba(185, 28, 28, 0.25)',
      border: 'rgba(217, 119, 6, 0.4)',
      gradient: 'from-[#7f1d1d]/80 via-[#991b1b]/40 to-transparent'
    }
  },
  slytherin: {
    id: 'slytherin',
    nameKo: '슬리데린',
    nameEn: 'Slytherin',
    animal: '뱀 (Serpent)',
    values: ['야망', '지략', '순결', '긍지'],
    motto: 'Sollertia et ambitio (지략과 야망으로 정상을 향해)',
    founder: '살라자르 슬리데린 (Salazar Slytherin)',
    colors: {
      primary: '#064e3b', // emerald green
      secondary: '#94a3b8', // polished silver
      accent: '#10b981',
      bgGlow: 'rgba(6, 78, 59, 0.3)',
      border: 'rgba(16, 185, 129, 0.4)',
      gradient: 'from-[#064e3b]/80 via-[#047857]/40 to-transparent'
    }
  },
  ravenclaw: {
    id: 'ravenclaw',
    nameKo: '래번클로',
    nameEn: 'Ravenclaw',
    animal: '독수리 (Eagle)',
    values: ['지혜', '지성', '창의성', '통찰'],
    motto: 'Sapientia et scientia (지혜는 가장 위대한 보물이다)',
    founder: '로웨나 래번클로 (Rowena Ravenclaw)',
    colors: {
      primary: '#1e3a8a', // deep sapphire blue
      secondary: '#b45309', // bronze / copper
      accent: '#38bdf8',
      bgGlow: 'rgba(30, 58, 138, 0.3)',
      border: 'rgba(56, 189, 248, 0.4)',
      gradient: 'from-[#1e3a8a]/80 via-[#2563eb]/30 to-transparent'
    }
  },
  hufflepuff: {
    id: 'hufflepuff',
    nameKo: '후플푸프',
    nameEn: 'Hufflepuff',
    animal: '오소리 (Badger)',
    values: ['헌신', '성실', '친절', '공정'],
    motto: 'Fidelitas et industria (성실과 신의로 모두를 품다)',
    founder: '헬가 후플푸프 (Helga Hufflepuff)',
    colors: {
      primary: '#b45309', // warm amber yellow
      secondary: '#3f3f46', // charcoal black
      accent: '#facc15',
      bgGlow: 'rgba(234, 179, 8, 0.25)',
      border: 'rgba(250, 204, 21, 0.4)',
      gradient: 'from-[#78350f]/80 via-[#b45309]/30 to-transparent'
    }
  }
};
