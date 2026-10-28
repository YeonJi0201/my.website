/** Vector wordmark: an illuminated storybook beneath a pointed medieval arch. */
export function StorybookLogo() {
  return <div className="storybook-logo">
    <svg viewBox="0 0 440 470" role="img" aria-labelledby="storybook-logo-title">
      <title id="storybook-logo-title">Once Upon a time...</title>
      <defs><linearGradient id="antique-gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a38b58"/><stop offset=".45" stopColor="#f0e0b5"/><stop offset="1" stopColor="#ad9058"/></linearGradient></defs>
      <g fill="none" stroke="url(#antique-gold)">
        <path d="M52 385V225Q52 101 220 29Q388 101 388 225V385" opacity=".5" />
        <path d="M65 373V226Q65 115 220 44Q375 115 375 226V373" opacity=".28" />
        <path d="M220 8V30M209 19H231M220 415V444M207 430H233" />
        <path d="M89 373Q150 353 220 378Q290 353 351 373L347 405Q280 388 220 411Q160 388 93 405Z" />
        <path d="M220 378V411M103 383Q160 371 205 388M235 388Q280 371 337 383" opacity=".6" />
        <path d="M111 127Q86 173 109 201M329 127Q354 173 331 201M108 160L94 149M332 160L346 149M220 83L225 97L239 102L225 107L220 121L215 107L201 102L215 97Z" />
      </g>
      <g fill="url(#antique-gold)" textAnchor="middle">
        <text x="220" y="204" className="logo-once">Once</text>
        <text x="220" y="258" className="logo-upon">Upon a</text>
        <text x="220" y="329" className="logo-time">time...</text>
      </g>
    </svg>
    <p>모든 마법은, 하나의 이야기에서 시작된다.</p>
  </div>;
}
