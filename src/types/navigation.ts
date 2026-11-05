// 해시 이동, 메인 섹션 선택과 반복 스크롤 요청에 사용하는 내비게이션 타입이다.
// 해시 이동, 메인 섹션 선택과 반복 스크롤 요청에 사용하는 내비게이션 타입이다.
export type NavigationTarget = 'home' | 'world' | 'directory' | 'system' | 'timetable';
export type HomeSection = Exclude<NavigationTarget, 'directory'>;
export type ScrollRequest = { section: HomeSection; sequence: number };
