import gryffindor from '../assets/images/portrait_gryffindor_oc_1791347670977.jpg';
import slytherin from '../assets/images/portrait_slytherin_oc_1791347687738.jpg';
import ravenclaw from '../assets/images/portrait_ravenclaw_oc_1791347700957.jpg';
import hufflepuff from '../assets/images/portrait_hufflepuff_oc_1791347713719.jpg';

const portraits: Record<string, string> = {
  '/src/assets/images/portrait_gryffindor_oc_1791347670977.jpg': gryffindor,
  '/src/assets/images/portrait_slytherin_oc_1791347687738.jpg': slytherin,
  '/src/assets/images/portrait_ravenclaw_oc_1791347700957.jpg': ravenclaw,
  '/src/assets/images/portrait_hufflepuff_oc_1791347713719.jpg': hufflepuff,
};
// 이전 원본 경로를 Vite 번들 자산으로 바꾸고, 이미 번들된 URL은 그대로 유지한다.
// 이전 원본 경로를 Vite 번들 자산으로 바꾸고, 이미 번들된 URL은 그대로 유지한다.
export const resolvePortrait = (image: string) => portraits[image] || image;
