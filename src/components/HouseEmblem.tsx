import { HouseType } from '../types/character';

const animals = { gryffindor: '사자', slytherin: '뱀', ravenclaw: '독수리', hufflepuff: '오소리' };
/** Original line-work for the four heraldic animals. */
export function HouseEmblem({ house, className = '' }: { house: HouseType; className?: string }) {
  return <svg className={`house-emblem ${className}`} viewBox="0 0 120 140" role="img" aria-label={`${animals[house]} 문장`}>
    <path className="crest-shield" d="M12 15Q60 2 108 15V72Q108 112 60 133Q12 112 12 72Z" fill="none" stroke="currentColor" />
    <path d="M19 21Q60 10 101 21V71Q101 106 60 125Q19 106 19 71Z" fill="none" stroke="currentColor" opacity=".3" />
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      {house === 'gryffindor' && <>
        <path d="M60 30L72 34L80 31L82 43L92 52L86 62L89 76L77 84L72 100L60 111L48 100L43 84L31 76L34 62L28 52L38 43L40 31L48 34Z" />
        <path d="M43 47L47 40L54 45H66L73 40L77 47L73 60L77 73L70 86L60 94L50 86L43 73L47 60ZM48 58L54 61M72 58L66 61M55 72H65L60 78ZM60 78V83L53 85M60 83L67 85M39 60L39 78M81 60V78M46 87L49 98M74 87L71 98" />
      </>}
      {house === 'slytherin' && <>
        <path d="M78 37Q41 23 36 48Q32 64 62 70Q88 76 80 94Q73 112 48 100Q34 92 46 82Q52 77 62 82Q68 86 62 90Q55 93 53 88M78 37L88 44L77 53Q58 42 51 50Q47 57 67 61Q104 72 92 100Q81 122 48 111Q20 101 30 80Q36 66 50 68" />
        <path d="M77 42H78M87 46L97 43M94 44L98 48M39 45L46 47M40 54L46 55M72 70L69 76M81 82L87 83M75 101L77 107M43 96L39 100" />
      </>}
      {house === 'ravenclaw' && <>
        <path d="M52 49L55 35L66 32L75 40L66 45L69 55L101 31L95 52L80 68L99 59L88 79L72 86L79 100L65 95L60 111L55 95L41 100L48 86L32 79L21 59L40 68L25 52L19 31L51 55ZM55 70L60 86L65 70M28 45L46 61M92 45L74 61M35 75L47 79M85 75L73 79M61 38H62" />
      </>}
      {house === 'hufflepuff' && <>
        <path d="M39 47L30 36Q26 28 35 29L47 35Q60 30 73 35L85 29Q94 28 90 36L81 47L85 66L77 88L60 107L43 88L35 66Z" />
        <path d="M47 39L40 61L47 82L54 92L50 64L56 39M73 39L80 61L73 82L66 92L70 64L64 39M42 60L47 61M78 60L73 61M53 84L60 80L67 84L60 90ZM60 90V97M43 74L29 71M43 79L29 80M77 74L91 71M77 79L91 80" />
      </>}
    </g>
  </svg>;
}
