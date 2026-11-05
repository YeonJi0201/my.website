import type { Character } from '../types/character.ts';

// 서버 저장소가 아직 없을 때 명부에 제공하는 예시 인물 프로필 모음이다.
export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'char-gryffindor-valerie',
    nameKo: '발레리 애쉬우드',
    nameEn: 'Valerie Ashwood',
    house: 'gryffindor',
    gender: '여성',
    age: 16,
    year: 6,
    birthday: '10월 24일',
    bloodStatus: '혼혈',
    wand: {
      wood: '마가목 (Rowan)',
      core: '불사조 깃털 (Phoenix Feather)',
      length: '11.5인치',
      flexibility: '유연하면서도 단호함'
    },
    patronus: '붉은 여우 (Red Fox)',
    boggart: '자신 때문에 다치는 동료들의 그림자',
    image: '/src/assets/images/portrait_gryffindor_oc_1791347670977.jpg',
    appearanceSummary: '붉은빛이 감도는 짙은 갈색 머리와 금빛 눈동자, 당당하고 곧은 자세.',
    appearanceDetail: '168cm의 늘씬하고 단련된 체격. 항상 단정하지만 망토 깃을 살짝 세워 입는 버릇이 있으며, 왼팔에는 그리핀도르 퀴디치 추격꾼 완장이 채워져 있다. 손끝에는 지팡이 연습으로 굳은살이 박여 있고, 불꽃처럼 타오르는 앰버빛 눈동자가 인상적이다.',
    personality: ['의리파', '직선적인', '정의감', '승부욕', '따뜻한 온기'],
    personalityDetail: '불의를 보면 마법 지팡이보다 주먹이 먼저 나갈 뻔할 만큼 정의롭고 다혈질이지만, 어린 후배들을 챙길 때는 더없이 다정하다. 타인의 눈치를 보지 않고 스스로 옳다고 믿는 길을 묵묵히 걸어가는 강철 같은 심장의 소유자.',
    background: '마법부 오러 출신 마법사 아버지와 머글 의사 어머니 사이에서 태어났다. 어린 시절부터 마법 결투와 비행술에 비범한 재능을 보였으며, 호그와트 입학 첫날 모자가 머리에 닿자마자 그리핀도르를 외쳤다. 5학년 때 금지된 숲에서 길을 잃은 후배를 구출해 학교 공로상을 받았다.',
    quote: '"도망치지 마. 어둠이 짙을수록 우리가 밝혀야 할 루모스는 더 찬란해야 하니까."',
    specialty: '어둠의 마법 방어술 및 비행술',
    positionOrClub: '그리핀도르 퀴디치 팀 추격꾼 (Chaser)',
    trivia: [
      '가장 좋아하는 간식은 허니듀크의 피징 위즈비(Fizzing Whizbees)',
      '비행 시 빗자루는 파이어볼트 2000을 애용함',
      '빗소리를 들으며 그리핀도르 휴게실 난롯가에서 양피지 일기를 쓰는 취미가 있음'
    ],
    createdAt: 1710000001000
  },
  {
    id: 'char-slytherin-cassian',
    nameKo: '카시안 말로리',
    nameEn: 'Cassian Malory',
    house: 'slytherin',
    gender: '남성',
    age: 17,
    year: 7,
    birthday: '1월 19일',
    bloodStatus: '순수혈통',
    wand: {
      wood: '주목 (Yew)',
      core: '용의 심장줄 (Dragon Heartstring)',
      length: '12.8인치',
      flexibility: '단단하고 굽힘 없음'
    },
    patronus: '은빛 흑표범 (Silver Panther)',
    boggart: '통제력을 잃고 몰락한 자신의 모습',
    image: '/src/assets/images/portrait_slytherin_oc_1791347687738.jpg',
    appearanceSummary: '창백한 안색과 차가운 에메랄드빛 눈동자, 단정히 넘긴 흑발.',
    appearanceDetail: '182cm의 큰 키에 서늘하고 귀족적인 분위기를 풍긴다. 교복은 한 치의 오차도 없이 단정하며, 가문의 상징인 은제 뱀 인장 반지를 오른손 약지에 끼고 있다. 목소리는 낮고 침착하여 한마디만으로도 주변을 침묵시키는 카리스마가 있다.',
    personality: ['지략가', '냉철함', '철저한 완벽주의', '은근한 집착', '예의 바른 오만'],
    personalityDetail: '감정에 휩쓸리지 않고 모든 상황을 체스판처럼 계산한다. 타인에게 쉽게 곁을 주지 않으나 한 번 자신의 경계선 안에 들인 사람은 목숨을 걸고서라도 비호한다. 겉으로는 우아하고 품위 있는 신사이지만 그 이면에는 야수 같은 야망이 도사리고 있다.',
    background: '영국 마법 사회의 오래된 명문 순수혈통 가문인 말로리 가문의 장남. 가문의 가르침에 따라 마법의 법률과 어둠의 마법 이론에 정통하다. 현재 슬리데린 기숙사 반장을 맡고 있으며 차기 마법부 장관 비서실 인턴십이 내정되어 있다.',
    quote: '"체스에서 킹이 살아남는 건 자비 때문이 아니야. 계산된 희생이 있었기 때문이지."',
    specialty: '마법약 제조학 및 변신술',
    positionOrClub: '슬리데린 기숙사 반장 (Prefect), 슬러그 클럽 회원',
    trivia: [
      '쓴 에스프레소와 박하사탕을 즐겨 먹음',
      '어린 시절부터 고문서 해독에 능해 고대 룬 문자 만점자',
      '잠을 잘 때도 소리 감지 마법을 침대 주변에 걸어두는 습관이 있음'
    ],
    createdAt: 1710000002000
  },
  {
    id: 'char-ravenclaw-seraphina',
    nameKo: '세라피나 베인',
    nameEn: 'Seraphina Vane',
    house: 'ravenclaw',
    gender: '여성',
    age: 15,
    year: 5,
    birthday: '7월 3일',
    bloodStatus: '혼혈',
    wand: {
      wood: '버드나무 (Willow)',
      core: '유니콘 꼬리털 (Unicorn Hair)',
      length: '10.8인치',
      flexibility: '유연하고 휘어짐'
    },
    patronus: '점박이 올빼미 (Barn Owl)',
    boggart: '세상의 모든 지식이 불타 사라지는 도서관',
    image: '/src/assets/images/portrait_ravenclaw_oc_1791347700957.jpg',
    appearanceSummary: '신비로운 백금발의 땋은 머리와 깊은 사파이어빛 눈동자, 몽환적인 미소.',
    appearanceDetail: '162cm의 아담한 체구. 교복 주머니에는 늘 접힌 양피지와 별자리 관측기가 삐져나와 있다. 은색 별 모양 귀걸이를 하고 있으며, 허공을 응시하며 생각에 잠길 때가 많아 마치 다른 세계와 교신하는 듯한 독특한 분위기를 풍긴다.',
    personality: ['호기심 천국', '창의적', '독창적 괴짜', '직관적 통찰', '순수한 열정'],
    personalityDetail: '상식의 틀에 갇히는 것을 거부하며 세상에 존재하지 않는 새로운 마법 공식을 탐구하는 괴짜 천재. 타인의 험담이나 시선에 전혀 개의치 않으며, 호기심이 생기면 밤새 천문탑에 숨어 별을 관측할 정도로 탐구열이 뜨겁다.',
    background: '천문학자 어머니와 신비한 동물 돌보기 연구원 아버지 사이에서 태어났다. 어린 시절부터 고대 별자리 지도와 잊혀진 예언에 매료되었다. 3학년 때 천문탑에서 새로운 혜성의 궤도를 마법적으로 예측해 호그와트 학술지에 논문을 기고했다.',
    quote: '"모두가 답을 외울 때, 난 왜 그 질문이 생겨났는지가 더 궁금해."',
    specialty: '천문학 및 점술학, 마법 주문학',
    positionOrClub: '천문학 연구회 회장, 고대 룬문자 학회',
    trivia: [
      '가장 아끼는 물건은 증조할머니께 물려받은 황동 천구의',
      '양말 짝을 늘 다르게 신고 다니며 "균형의 역발상"이라고 주장함',
      '차(Tea)의 찻잎 모양으로 하루의 운세를 점치는 아침 루틴이 있음'
    ],
    createdAt: 1710000003000
  },
  {
    id: 'char-hufflepuff-felix',
    nameKo: '펠릭스 쏜',
    nameEn: 'Felix Thorne',
    house: 'hufflepuff',
    gender: '남성',
    age: 16,
    year: 6,
    birthday: '5월 12일',
    bloodStatus: '머글태생',
    wand: {
      wood: '사과나무 (Applewood)',
      core: '세스트랄 꼬리털 (Thestral Hair)',
      length: '11.2인치',
      flexibility: '상냥하면서도 탄력 있음'
    },
    patronus: '골든 리트리버 (Golden Retriever)',
    boggart: '자신이 돌보던 식물과 동물들이 전부 말라죽는 환영',
    image: '/src/assets/images/portrait_hufflepuff_oc_1791347713719.jpg',
    appearanceSummary: '포근한 햇살 같은 갈색 곱슬머리와 따스한 호박색 눈동자, 햇볕에 그을린 건강한 피부.',
    appearanceDetail: '176cm의 다부진 체격. 손에는 늘 흙먼지나 약초 즙이 살짝 묻어 있으며 옷깃에서 은은한 카모마일 향이 난다. 소매를 편하게 걷어붙인 모습이 자연스러우며, 언제나 주변 사람들을 편안하게 만들어주는 온화한 미소를 짓고 있다.',
    personality: ['다정다감', '성실한 노력파', '믿음직한', '인내심', '치유자적 성품'],
    personalityDetail: '말없이 묵묵히 궂은일을 도맡아 하는 성실의 아이콘. 화를 내는 모습을 보기 힘들 정도로 부드러운 성격이지만, 약한 자를 괴롭히는 자 앞에서는 꺾이지 않는 거목처럼 단호해진다. 다른 기숙사 학생들도 고민이 생기면 그를 찾아올 만큼 신뢰받는다.',
    background: '런던 교외 온실 원예가 가정에서 태어난 머글 태생 마법사. 호그와트 입학통지서를 받았을 때 가족 모두가 기적이라며 축하해주었다. 입학 직후부터 온실에서 스프라우트 교수님을 도와 마법 식물들을 키우며 약초학 분야에서 두각을 나타냈다.',
    quote: '"모든 씨앗은 기다려주면 언젠가 꽃을 피워. 사람도 마찬가지 아닐까?"',
    specialty: '약초학 (Herbology) 및 신비한 동물 돌보기',
    positionOrClub: '온실 관리 조교, 후플푸프 식물 동아리 부장',
    trivia: [
      '주머니에 항상 보우트러클용 나무벌레나 호박 파이를 넣고 다님',
      '추운 날씨에 친구들에게 직접 끓인 온기 유지 허브티를 나눠줌',
      '아침에 제일 먼저 일어나 온실 식물들에게 인사하는 습관이 있음'
    ],
    createdAt: 1710000004000
  },
  {
    id: 'char-gryffindor-leon',
    nameKo: '레온 싱클레어',
    nameEn: 'Leon Sinclair',
    house: 'gryffindor',
    gender: '남성',
    age: 15,
    year: 5,
    birthday: '8월 14일',
    bloodStatus: '혼혈',
    wand: {
      wood: '떡갈나무 (English Oak)',
      core: '용의 심장줄 (Dragon Heartstring)',
      length: '12인치',
      flexibility: '단단함'
    },
    patronus: '붉은 사슴 (Red Deer)',
    boggart: '자신의 용기가 무력해져 아무도 지키지 못하는 순간',
    image: '/src/assets/images/portrait_gryffindor_oc_1791347670977.jpg',
    appearanceSummary: '강렬한 붉은 갈색 머리와 결의에 찬 눈빛, 씩씩한 미소.',
    appearanceDetail: '174cm. 활동적이며 활기 넘치는 움직임. 퀴디치 몰이꾼으로서 단단한 어깨를 가지고 있으며 망토를 펄럭이며 복도를 달리는 모습이 자주 목격된다.',
    personality: ['호쾌함', '돌격대장', '의협심', '유쾌한 분위기 메이커'],
    personalityDetail: '어떤 난관 앞에서도 "해보지 않고 어떻게 알아?"라며 뛰어드는 용맹함의 대명사. 분위기가 침체될 때 유쾌한 농담으로 기운을 북돋아주는 친구.',
    background: '스코틀랜드 고원 지대 마법사 마을 출신. 어린 시절부터 거친 바람을 맞으며 빗자루를 탔다. 그리핀도르의 퀴디치 우승을 위해 밤낮으로 훈련 중이다.',
    quote: '"두려움이란 건, 결국 우리가 넘어서야 할 계단일 뿐이야!"',
    specialty: '비행술 및 결투 마법',
    positionOrClub: '그리핀도르 퀴디치 팀 몰이꾼 (Beater)',
    trivia: [
      '매운 호박 파이를 한 번에 다섯 개나 먹을 수 있는 대식가',
      '빗자루 손질 도구를 직접 가죽 파우치에 넣어 다님'
    ],
    createdAt: 1710000005000
  },
  {
    id: 'char-slytherin-evelyn',
    nameKo: '에블린 블랙우드',
    nameEn: 'Evelyn Blackwood',
    house: 'slytherin',
    gender: '여성',
    age: 16,
    year: 6,
    birthday: '11월 30일',
    bloodStatus: '순수혈통',
    wand: {
      wood: '흑단 (Ebony)',
      core: '불사조 깃털 (Phoenix Feather)',
      length: '11인치',
      flexibility: '유연하면서도 서늘함'
    },
    patronus: '백조 (Swan)',
    boggart: '자신의 약점이 적에게 노출되는 광경',
    image: '/src/assets/images/portrait_slytherin_oc_1791347687738.jpg',
    appearanceSummary: '윤기 나는 검은 긴 생머리와 날카롭고 매혹적인 은회색 눈동자.',
    appearanceDetail: '166cm. 정갈하고 우아한 실루엣. 슬리데린 특유의 은색 머리핀을 착용하고 있으며, 고혹적이면서도 쉽게 다가갈 수 없는 기품을 지녔다.',
    personality: ['치밀함', '자존심', '완벽주의', '비밀주의', '품격'],
    personalityDetail: '상대방의 심리를 꿰뚫어보는 통찰력이 뛰어나며, 결코 속내를 쉽게 드러내지 않는다. 품위와 긍지를 가장 소중히 여기며 타인에게 절대 흐트러진 모습을 보이지 않는다.',
    background: '오래된 마법 약초 및 물약 가문인 블랙우드가의 외동딸. 가문의 비밀 서고에서 어릴 때부터 마법 고서들을 독파했다. 마법약 조제 실력은 교수진도 인정할 만큼 탁월하다.',
    quote: '"모든 위대한 승리는 조용히 어둠 속에서 준비되는 법이야."',
    specialty: '마법약학 및 기억 마법',
    positionOrClub: '마법약 연구회, 슬러그 클럽',
    trivia: [
      '직접 조합한 수면 유도 마법 향수를 방에 피워둠',
      '백차(White Tea)를 은잔에 우려 마시는 것을 즐김'
    ],
    createdAt: 1710000006000
  }
];
