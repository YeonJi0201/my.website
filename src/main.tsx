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

// React 앱을 HTML 진입 요소에 마운트하고, 전역 스타일은 화면별 우선순위대로 불러온다.
// React 앱을 HTML 진입 요소에 마운트하고, 전역 스타일은 화면별 우선순위대로 불러온다.
createRoot(document.getElementById('root')!).render(<App />);
