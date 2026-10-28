export type NavigationTarget = 'home' | 'world' | 'directory' | 'system' | 'timetable';
export type HomeSection = Exclude<NavigationTarget, 'directory'>;
export type ScrollRequest = { section: HomeSection; sequence: number };
