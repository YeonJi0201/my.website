import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './chronicle.css';
import './house-themes.css';
import './character-showcase.css';
import './admin.css';
import './scroll-story.css';
import './redesign.css';
import './moonlit.css';

// 첫 로딩 로고 연출: 페이지가 처음 열릴 때만 data-site-intro를 켜고, intro-* 애니메이션이 모두 끝나면 끈다.
// 연출이 끝난 뒤에는 관련 CSS가 전혀 적용되지 않아 평소 화면과 같다. 혹시 끝나지 않아도 15초 뒤 강제로 해제한다.
const root = document.documentElement;
root.dataset.siteIntro = 'on';
const endIntro = () => { delete root.dataset.siteIntro; };
window.setTimeout(endIntro, 15000);

// React 앱을 HTML 진입 요소에 마운트하고, 전역 스타일은 화면별 우선순위대로 불러온다.
createRoot(document.getElementById('root')!).render(<App />);

requestAnimationFrame(() => requestAnimationFrame(() => {
  const intro = document.getAnimations().filter(a => a instanceof CSSAnimation && a.animationName.startsWith('intro-'));
  Promise.all(intro.map(a => a.finished)).then(endIntro, endIntro);
}));
