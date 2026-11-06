import { forwardRef, type CSSProperties } from 'react'

// The launch page illustration: a Konkan homestay with trees, a path, the sun and moon, stars, birds and
// two travellers. LaunchClient drives the night-to-sunrise sequence by changing the attributes of the
// elements with an id, and the classes lit / path-on / live on the <svg>; the rest is in launch.css.

const vars = (v: Record<string, string>) => v as CSSProperties

const NIGHT_TITLE = 'A small traditional Konkan homestay at night under a moon and stars, with hills, palms and trees around it.'

const LaunchScene = forwardRef<SVGSVGElement, { name: string; live: boolean }>(function LaunchScene({ name, live }, ref) {
  return (
    <svg ref={ref} id="scene" viewBox="30 56 500 310" role="img" aria-labelledby="sceneTitle">
      <title id="sceneTitle">
        {live
          ? `${name} in soft morning light, its windows glowing, a stone path leading to the door and two travellers walking up to it.`
          : NIGHT_TITLE}
      </title>
      <defs>
        <radialGradient id="gWarm"><stop offset="0" stopColor="#F4E2B4" stopOpacity=".95" /><stop offset=".55" stopColor="#F4E2B4" stopOpacity=".35" /><stop offset="1" stopColor="#F4E2B4" stopOpacity="0" /></radialGradient>
        <radialGradient id="gGreen"><stop offset="0" stopColor="#B9D3A8" stopOpacity=".9" /><stop offset=".6" stopColor="#B9D3A8" stopOpacity=".3" /><stop offset="1" stopColor="#B9D3A8" stopOpacity="0" /></radialGradient>
        <radialGradient id="gLamp"><stop offset="0" stopColor="#F8DF97" stopOpacity=".95" /><stop offset="1" stopColor="#F8DF97" stopOpacity="0" /></radialGradient>
      </defs>

      <defs>
        <linearGradient id="gNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E3D63" /><stop offset="1" stopColor="#6A85BE" /></linearGradient>
        <linearGradient id="gDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6F6A93" /><stop offset=".42" stopColor="#C094A3" /><stop offset=".72" stopColor="#EDB596" /><stop offset="1" stopColor="#F6D9AB" /></linearGradient>
        <linearGradient id="gDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6EDEA" /><stop offset="1" stopColor="#F8F3E7" /></linearGradient>
        <radialGradient id="gSunHalo"><stop offset="0" stopColor="#F6CF9E" stopOpacity=".9" /><stop offset="1" stopColor="#F6CF9E" stopOpacity="0" /></radialGradient>
      </defs>
      {/* layered sky: night, dawn, morning */}
      <rect x="20" y="40" width="520" height="340" fill="url(#gNight)" />
      <rect id="skyDawn" x="20" y="40" width="520" height="340" fill="url(#gDawn)" opacity="0" />
      <rect id="skyDay" x="20" y="40" width="520" height="340" fill="url(#gDay)" opacity="0" />
      {/* warm sunlight */}
      <g id="beamWrap" opacity="0"><path className="beam" d="M404 128 L432 140 L360 300 L250 300 Z" fill="#F2E4BF" /></g>
      {/* the sun, rising behind the hills */}
      <g id="sunG" transform="translate(404 300)">
        <circle id="sunHalo" r="70" fill="url(#gSunHalo)" opacity="0" />
        <g id="raysWrap" opacity="0"><g className="rays"><g stroke="#EADBB6" strokeWidth="3" strokeLinecap="round"><path d="M0 -52 v-8 M0 52 v8 M-52 0 h-8 M52 0 h8 M-37 -37 l-6 -6 M37 37 l6 6 M37 -37 l6 -6 M-37 37 l-6 6" /></g></g></g>
        <circle id="sunDisc" r="36" fill="#EE9F73" />
      </g>
      {/* slow clouds */}
      <g id="cloudsWrap" opacity=".3">
        <g transform="translate(130 104) scale(.85)"><path className="cloud" style={vars({ '--dx': '34px', '--dur': '26s' })} d="M-42 10 C-50 10 -52 -6 -38 -8 C-38 -22 -18 -26 -10 -16 C-4 -30 22 -30 24 -12 C36 -14 44 -2 38 10 Z" fill="#FDFBF7" stroke="#E4DCCC" strokeWidth="1.4" strokeLinejoin="round" /></g>
        <g transform="translate(300 84) scale(.62)"><path className="cloud" style={vars({ '--dx': '-40px', '--dur': '34s', '--delay': '-8s' })} d="M-42 10 C-50 10 -52 -6 -38 -8 C-38 -22 -18 -26 -10 -16 C-4 -30 22 -30 24 -12 C36 -14 44 -2 38 10 Z" fill="#FDFBF7" stroke="#E4DCCC" strokeWidth="1.8" strokeLinejoin="round" /></g>
        <g transform="translate(486 156) scale(.55)"><path className="cloud" style={vars({ '--dx': '-30px', '--dur': '30s', '--delay': '-14s' })} d="M-42 10 C-50 10 -52 -6 -38 -8 C-38 -22 -18 -26 -10 -16 C-4 -30 22 -30 24 -12 C36 -14 44 -2 38 10 Z" fill="#FDFBF7" stroke="#E4DCCC" strokeWidth="2" strokeLinejoin="round" /></g>
      </g>
      <g className="appear hills-far"><path d="M-10 236 Q 70 150 170 196 Q 250 128 352 186 Q 450 132 570 196 V300 H-10 Z" fill="#E3E9DA" /></g>
      <g className="appear hills-mid"><path d="M-10 262 Q 110 202 236 250 Q 352 208 452 246 Q 512 228 570 238 V300 H-10 Z" fill="#CFD9C3" /></g>

      <g id="warmWrap" opacity="0"><circle className="warm" cx="280" cy="236" r="190" fill="url(#gWarm)" /></g>

      {/* trees */}
      <g className="appear trees">
        {/* trees behind the house */}
        <g className="sway slow">
          <rect x="146" y="252" width="7" height="48" rx="3" fill="#8A6E52" />
          <circle cx="150" cy="240" r="28" fill="#6B8A5E" />
          <circle cx="134" cy="252" r="16" fill="#7E9A6E" />
        </g>
        <g className="sway">
          <rect x="404" y="250" width="6" height="50" rx="3" fill="#8A6E52" />
          <circle cx="407" cy="236" r="22" fill="#7E9A6E" />
        </g>
        <g className="sway" transform="translate(0 0)">
          <path d="M104 300 Q 96 250 116 190" fill="none" stroke="#8A6E52" strokeWidth="7" strokeLinecap="round" />
          <path d="M101 280 h7 M99 262 h7 M101 244 h7 M104 226 h7 M108 208 h7" stroke="#6E5641" strokeWidth="1.5" strokeLinecap="round" />
          <g fill="#5E7F52" stroke="#3F5A37" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M116 190 Q 88 178 66 196 Q 92 186 116 192 Z" />
            <path d="M116 190 Q 98 160 74 162 Q 100 172 116 192 Z" />
            <path d="M116 190 Q 122 158 146 150 Q 126 168 118 192 Z" />
            <path d="M116 190 Q 146 172 168 186 Q 142 182 118 193 Z" />
            <path d="M116 190 Q 138 196 152 216 Q 132 202 116 194 Z" />
            <path d="M116 190 Q 92 198 82 218 Q 98 202 116 194 Z" />
          </g>
        </g>
        <g className="sway slow">
          <path d="M58 300 Q 54 266 64 232" fill="none" stroke="#8A6E52" strokeWidth="5" strokeLinecap="round" />
          <g fill="#7A9668" stroke="#4D6843" strokeWidth="1.2" strokeLinejoin="round">
            <path d="M64 232 Q 44 222 30 236 Q 48 230 64 234 Z" />
            <path d="M64 232 Q 54 210 38 210 Q 54 220 64 234 Z" />
            <path d="M64 232 Q 70 210 88 206 Q 74 220 65 234 Z" />
            <path d="M64 232 Q 84 224 96 236 Q 80 232 65 235 Z" />
          </g>
        </g>
        <g className="sway slow">
          <rect x="447" y="252" width="8" height="48" rx="3" fill="#8A6E52" />
          <circle cx="451" cy="232" r="34" fill="#4E6E45" />
          <circle cx="428" cy="246" r="22" fill="#5F7F55" />
          <circle cx="474" cy="244" r="24" fill="#5F7F55" />
          <circle cx="456" cy="214" r="20" fill="#6B8A5E" />
        </g>
        <g className="sway">
          <rect x="505" y="268" width="6" height="32" rx="2" fill="#8A6E52" />
          <circle cx="508" cy="256" r="20" fill="#7E9A6E" />
          <circle cx="497" cy="266" r="12" fill="#6B8A5E" />
        </g>
      </g>

      {/* ground */}
      <path d="M-10 302 Q 280 278 570 302 V370 H-10 Z" fill="#D4DDC7" />
      <path d="M-10 334 Q 280 318 570 334 V370 H-10 Z" fill="#C8D3BA" />

      {/* path to the door */}
      <g>
        <path d="M258 312 H302 Q 322 336 352 370 H208 Q 238 336 258 312 Z" fill="#E3D8C2" opacity=".7" />
        <path className="pfill" d="M258 312 H302 Q 322 336 352 366 H208 Q 238 336 258 312 Z" fill="#E7DCC6" />
        {/* flowers along the path */}
        <g stroke="#6B8A5E" strokeWidth="1.3" strokeLinecap="round"><path d="M226 348 v-7 M232 352 v-9 M336 346 v-8 M342 352 v-7 M214 362 v-7 M350 362 v-8" /></g>
        <g><circle cx="226" cy="340" r="2.6" fill="#D2A34A" /><circle cx="232" cy="342" r="2.6" fill="#C98F5E" /><circle cx="336" cy="337" r="2.6" fill="#D2A34A" /><circle cx="342" cy="344" r="2.6" fill="#E9E1D2" /><circle cx="214" cy="354" r="2.6" fill="#E9E1D2" /><circle cx="350" cy="353" r="2.6" fill="#C98F5E" /></g>
        <path className="pedge" d="M206 366 Q 238 336 258 312" fill="none" stroke="#B7A17F" strokeWidth="2" strokeLinecap="round" />
        <path className="pedge" d="M354 366 Q 322 336 302 312" fill="none" stroke="#B7A17F" strokeWidth="2" strokeLinecap="round" />
        <ellipse className="stone s1" cx="278" cy="352" rx="15" ry="4.5" fill="#D3C4A7" />
        <ellipse className="stone s2" cx="286" cy="337" rx="12" ry="3.8" fill="#D3C4A7" />
        <ellipse className="stone s3" cx="276" cy="325" rx="10" ry="3.2" fill="#D3C4A7" />
        <ellipse className="stone s4" cx="283" cy="316" rx="8" ry="2.6" fill="#D3C4A7" />
      </g>

      {/* the homestay (scaled up as one piece) */}
      <g transform="translate(280 306) scale(1.12) translate(-280 -306)">
        <g className="appear house">
          <path className="spill" d="M262 306 H298 L328 330 Q 280 338 232 330 Z" fill="#F4DE9E" />
          {/* plinth (laterite) */}
          <rect x="160" y="290" width="240" height="16" rx="3" fill="#B79B7E" stroke="#5E4A38" strokeWidth="2" />
          <path d="M176 298 h22 M214 298 h18 M248 298 h8 M308 298 h12 M336 298 h20 M372 298 h16" stroke="#9C8064" strokeWidth="1.5" strokeLinecap="round" />
          {/* walls */}
          <rect x="178" y="222" width="204" height="70" fill="#F6F1E7" stroke="#5E4A38" strokeWidth="2" />
          <rect x="178" y="276" width="204" height="16" fill="#DCCBB2" stroke="#5E4A38" strokeWidth="2" />
          {/* windows with wooden grills */}
          <rect className="win w1" x="196" y="244" width="30" height="28" rx="2" stroke="#6E5139" strokeWidth="2.5" />
          <path d="M206 244 v28 M216 244 v28" stroke="#6E5139" strokeWidth="2" />
          <rect className="win w3" x="334" y="244" width="30" height="28" rx="2" stroke="#6E5139" strokeWidth="2.5" />
          <path d="M344 244 v28 M354 244 v28" stroke="#6E5139" strokeWidth="2" />
          {/* open wooden shutters */}
          <g fill="#8A6E52" stroke="#5E4A38" strokeWidth="1.2"><rect x="191" y="244" width="5" height="28" rx="1" /><rect x="226" y="244" width="5" height="28" rx="1" /><rect x="329" y="244" width="5" height="28" rx="1" /><rect x="364" y="244" width="5" height="28" rx="1" /></g>
          {/* door */}
          <rect x="261" y="238" width="38" height="54" fill="#8A6E52" stroke="#5E4A38" strokeWidth="2" />
          <rect className="win w2" x="265" y="242" width="30" height="50" stroke="none" />
          <rect x="265" y="242" width="14.5" height="50" fill="#7A5C43" stroke="#5E4A38" strokeWidth="1.5" />
          <rect x="280.5" y="242" width="14.5" height="50" fill="#7A5C43" stroke="#5E4A38" strokeWidth="1.5" />
          <path d="M268 250 h8 v12 h-8 z M283.5 250 h8 v12 h-8 z M268 270 h8 v16 h-8 z M283.5 270 h8 v16 h-8 z" fill="none" stroke="#5E4A38" strokeWidth="1.1" />
          <circle cx="277" cy="268" r="1.4" fill="#C9B07A" /><circle cx="283" cy="268" r="1.4" fill="#C9B07A" />
          {/* mango-leaf toran */}
          <path d="M258 238 Q 280 244 302 238" fill="none" stroke="#5E4A38" strokeWidth="1.2" />
          <g fill="#5E7F52"><path d="M262 239.5 l2 7 l2 -6.6z" /><path d="M269 241 l2 7 l2 -6.4z" /><path d="M276.5 241.8 l2 7 l2 -6.6z" /><path d="M284 241.6 l2 7 l2 -6.4z" /><path d="M291 240.6 l2 7 l2 -6.6z" /></g>
          <g className="garland" fill="#D9A441"><circle cx="265" cy="242" r="2" /><circle cx="272.5" cy="243.4" r="2" /><circle cx="280" cy="244" r="2" /><circle cx="287.5" cy="243.4" r="2" /><circle cx="295" cy="242" r="2" /></g>
          {/* verandah pillars */}
          <g fill="#7A5C43" stroke="#5E4A38" strokeWidth="1.6">
            <rect x="182" y="232" width="8" height="58" /><rect x="238" y="232" width="8" height="58" />
            <rect x="314" y="232" width="8" height="58" /><rect x="370" y="232" width="8" height="58" />
          </g>
          <g fill="#A68A6C"><rect x="179" y="286" width="14" height="5" rx="1" /><rect x="235" y="286" width="14" height="5" rx="1" /><rect x="311" y="286" width="14" height="5" rx="1" /><rect x="367" y="286" width="14" height="5" rx="1" /></g>
          {/* hipped clay-tile roof */}
          <path d="M156 236 L212 166 H348 L404 236 Z" fill="#A97B5B" stroke="#5E4A38" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M172 216 H388 M188 196 H372 M203 178 H357" stroke="#8E6247" strokeWidth="1.6" />
          <path d="M200 236 v-20 M226 236 v-20 M252 236 v-20 M278 236 v-20 M304 236 v-20 M330 236 v-20 M356 236 v-20 M382 236 v-20 M210 216 v-20 M236 216 v-20 M262 216 v-20 M288 216 v-20 M314 216 v-20 M340 216 v-20 M366 216 v-20 M222 196 v-18 M248 196 v-18 M274 196 v-18 M300 196 v-18 M326 196 v-18 M350 196 v-18" stroke="#93684C" strokeWidth="1" />
          <path d="M210 166 H350" stroke="#6E4D38" strokeWidth="5" strokeLinecap="round" />
          <path d="M156 236 H404" stroke="#5E4A38" strokeWidth="2.2" />
          {/* hanging lantern */}
          <circle className="lampglow" cx="254" cy="252" r="22" fill="url(#gLamp)" />
          <path d="M254 236 v8" stroke="#5E4A38" strokeWidth="1.2" />
          <rect className="lampbody" x="250" y="244" width="8" height="11" rx="2" stroke="#5E4A38" strokeWidth="1.2" />
          {/* front steps and rangoli */}
          <rect x="262" y="304" width="36" height="6" rx="1.5" fill="#C9B396" stroke="#5E4A38" strokeWidth="1.4" />
          <rect x="257" y="309" width="46" height="6" rx="1.5" fill="#D6C3A8" stroke="#5E4A38" strokeWidth="1.4" />
          <g fill="none" stroke="#B8954F" strokeWidth="1"><ellipse cx="280" cy="320" rx="13" ry="3.6" strokeDasharray="2 2" /><ellipse cx="280" cy="320" rx="6" ry="1.7" /></g>
          {/* low bamboo fence */}
          <g stroke="#5E4A38" strokeWidth="1">
            <g fill="#B79B7E"><rect x="148" y="306" width="3" height="16" rx="1" /><rect x="160" y="306" width="3" height="16" rx="1" /><rect x="172" y="306" width="3" height="16" rx="1" /><rect x="184" y="306" width="3" height="16" rx="1" /><rect x="196" y="306" width="3" height="16" rx="1" /><rect x="226" y="306" width="3" height="16" rx="1" /><rect x="238" y="306" width="3" height="16" rx="1" />
              <rect x="319" y="306" width="3" height="16" rx="1" /><rect x="331" y="306" width="3" height="16" rx="1" /><rect x="343" y="306" width="3" height="16" rx="1" /><rect x="355" y="306" width="3" height="16" rx="1" /><rect x="367" y="306" width="3" height="16" rx="1" /><rect x="379" y="306" width="3" height="16" rx="1" /><rect x="391" y="306" width="3" height="16" rx="1" /></g>
            <path d="M146 311 H242 M146 317 H242 M317 311 H396 M317 317 H396" stroke="#8A6E52" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          {/* clay pots by the steps */}
          <g stroke="#5E4A38" strokeWidth="1.2"><ellipse cx="312" cy="312" rx="6.5" ry="6" fill="#A97B5B" /><rect x="308.5" y="303.5" width="7" height="3" rx="1" fill="#8E6247" /><ellipse cx="322" cy="314" rx="4.6" ry="4.4" fill="#B98B66" /></g>
          {/* tulsi vrindavan */}
          <g transform="translate(212 324)">
            <path d="M-5 -14 C -10 -24 -2 -30 0 -36 C 2 -30 10 -24 5 -14 Z" fill="#5E7F52" stroke="#3F5A37" strokeWidth="1.2" />
            <path d="M-8 -16 C -14 -22 -12 -28 -6 -26 C -6 -22 -4 -19 -2 -16 Z M8 -16 C 14 -22 12 -28 6 -26 C 6 -22 4 -19 2 -16 Z" fill="#7A9668" stroke="#3F5A37" strokeWidth="1" />
            <path d="M-12 -14 H12 L10 0 H-10 Z" fill="#EFE6D6" stroke="#5E4A38" strokeWidth="1.6" strokeLinejoin="round" />
            <rect x="-14" y="-17" width="28" height="4" rx="1.5" fill="#D9C7AE" stroke="#5E4A38" strokeWidth="1.4" />
            <path d="M-4 -9 h8 v6 h-8 z" fill="#C9B79B" />
          </g>
          {/* bushes */}
          <g fill="#7A9668" stroke="#4D6843" strokeWidth="1.4"><circle cx="168" cy="306" r="10" /><circle cx="182" cy="309" r="8" /><circle cx="390" cy="307" r="10" /><circle cx="376" cy="310" r="7.5" /></g>
          {/* live badge */}
          <g transform="translate(384 168)"><g className="badge">
            <circle r="17" fill="#1F4D1F" stroke="#F7F4EE" strokeWidth="3" />
            <path d="M-7 0.5 l4.5 4.5 l9.5 -9.5" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g></g>
        </g>
      </g>

      {/* travellers on the path */}
      <g transform="translate(252 352)"><g className="walker a">
        <g className="step">
          <ellipse cx="0" cy="1" rx="6" ry="1.6" fill="#5E4A38" opacity=".15" />
          <path d="M-2.4 -9 V0 M2.4 -9 V0" stroke="#4A3B2E" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="-5.5" y="-20" width="11" height="12.5" rx="4.5" fill="#5F7A4E" stroke="#4A3B2E" strokeWidth="1" />
          <rect x="3.5" y="-19" width="5" height="9" rx="2" fill="#A68A6C" stroke="#4A3B2E" strokeWidth="1" />
          <circle cx="0" cy="-24.5" r="4.6" fill="#C58C63" stroke="#4A3B2E" strokeWidth="1" />
          <path d="M-4.7 -25 a4.7 4.7 0 0 1 9.4 0 q-4.7 -2.4 -9.4 0z" fill="#2A2320" />
        </g>
      </g></g>
      <g transform="translate(306 356)"><g className="walker b">
        <g className="step">
          <ellipse cx="0" cy="1" rx="6" ry="1.6" fill="#5E4A38" opacity=".15" />
          <path d="M-2.4 -9 V0 M2.4 -9 V0" stroke="#4A3B2E" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M-5.5 -20 h11 l1.5 13 h-14 z" fill="#B59C82" stroke="#4A3B2E" strokeWidth="1" strokeLinejoin="round" />
          <rect x="-8.5" y="-19" width="5" height="9" rx="2" fill="#7A9668" stroke="#4A3B2E" strokeWidth="1" />
          <circle cx="0" cy="-24.5" r="4.6" fill="#E8B993" stroke="#4A3B2E" strokeWidth="1" />
          <path d="M-5 -24 q0 -6 5 -5.8 q5 -.2 5 5.8 q-1 4 -1 6 l-1.5 -6 q-2.5 -2 -5 0 l-1.5 6 q0 -2 -1 -6z" fill="#3B2A20" />
        </g>
      </g></g>

      {/* floating leaves */}
      <g aria-hidden="true">
        <g transform="translate(70 120)"><path className="leaf" style={vars({ '--dx': '150px', '--dy': '120px', '--rot': '220deg', '--dur': '15s', '--delay': '0s' })} d="M0 0 C4 -6 12 -6 15 0 C12 6 4 6 0 0Z" fill="#7A9668" /></g>
        <g transform="translate(470 110)"><path className="leaf" style={vars({ '--dx': '-130px', '--dy': '140px', '--rot': '-260deg', '--dur': '17s', '--delay': '-6s' })} d="M0 0 C4 -6 12 -6 15 0 C12 6 4 6 0 0Z" fill="#A9B89C" /></g>
        <g transform="translate(140 70)"><path className="leaf" style={vars({ '--dx': '180px', '--dy': '90px', '--rot': '300deg', '--dur': '19s', '--delay': '-11s' })} d="M0 0 C4 -6 12 -6 15 0 C12 6 4 6 0 0Z" fill="#5E7F52" /></g>
        <g transform="translate(400 160)"><path className="leaf" style={vars({ '--dx': '-160px', '--dy': '110px', '--rot': '-200deg', '--dur': '16s', '--delay': '-3s' })} d="M0 0 C4 -6 12 -6 15 0 C12 6 4 6 0 0Z" fill="#B7A17F" /></g>
        <g transform="translate(260 40)"><path className="leaf" style={vars({ '--dx': '120px', '--dy': '150px', '--rot': '240deg', '--dur': '18s', '--delay': '-9s' })} d="M0 0 C4 -6 12 -6 15 0 C12 6 4 6 0 0Z" fill="#7A9668" /></g>
        <g transform="translate(520 60)"><path className="leaf" style={vars({ '--dx': '-110px', '--dy': '120px', '--rot': '-280deg', '--dur': '20s', '--delay': '-14s' })} d="M0 0 C4 -6 12 -6 15 0 C12 6 4 6 0 0Z" fill="#5E7F52" /></g>
      </g>

      {/* night shade over the landscape, and the warm cast of dawn */}
      <rect id="nightShade" x="20" y="40" width="520" height="340" fill="#131A2C" opacity=".58" />
      <rect id="dawnCast" x="20" y="40" width="520" height="340" fill="#F0A07A" opacity="0" />

      {/* stars and moon */}
      <g id="stars" fill="#F3EEDD">
        <circle className="tw" cx="58" cy="74" r="1.2" /><circle cx="92" cy="128" r=".9" /><circle className="tw b" cx="160" cy="70" r="1.4" /><circle cx="188" cy="112" r="1" />
        <circle className="tw" cx="226" cy="86" r="1.1" /><circle cx="262" cy="64" r=".9" /><circle className="tw b" cx="300" cy="104" r="1.3" /><circle cx="336" cy="76" r="1" />
        <circle className="tw" cx="372" cy="122" r="1" /><circle cx="398" cy="66" r="1.4" /><circle className="tw b" cx="446" cy="92" r="1.1" /><circle cx="478" cy="70" r=".9" />
        <circle className="tw" cx="506" cy="118" r="1.2" /><circle cx="242" cy="132" r=".8" /><circle className="tw b" cx="128" cy="96" r=".9" /><circle cx="418" cy="140" r=".8" />
        <circle cx="74" cy="160" r=".8" /><circle className="tw" cx="490" cy="150" r=".9" />
      </g>
      <g id="moonG" transform="translate(112 96)">
        <circle r="30" fill="#EEE6CE" opacity=".08" />
        <path transform="rotate(-20)" d="M0 -15 A15 15 0 1 0 0 15 A19 19 0 0 1 0 -15 Z" fill="#F1EAD3" />
      </g>

      {/* warm lights inside the home (kept above the night shade) */}
      <g transform="translate(280 306) scale(1.12) translate(-280 -306)">
        <path id="lSpill" d="M262 306 H298 L328 330 Q 280 338 232 330 Z" fill="#F4DE9E" opacity="0" />
        <circle id="lGlow1" cx="211" cy="258" r="30" fill="url(#gLamp)" opacity="0" />
        <circle id="lGlow3" cx="349" cy="258" r="30" fill="url(#gLamp)" opacity="0" />
        <g id="lWin1" opacity="0"><rect x="196" y="244" width="30" height="28" rx="2" fill="#F4D78E" stroke="#6E5139" strokeWidth="2.5" /><path d="M206 244 v28 M216 244 v28" stroke="#6E5139" strokeWidth="2" /></g>
        <g id="lWin3" opacity="0"><rect x="334" y="244" width="30" height="28" rx="2" fill="#F4D78E" stroke="#6E5139" strokeWidth="2.5" /><path d="M344 244 v28 M354 244 v28" stroke="#6E5139" strokeWidth="2" /></g>
        <g id="lLamp" opacity="0"><circle cx="254" cy="252" r="22" fill="url(#gLamp)" /><rect x="250" y="244" width="8" height="11" rx="2" fill="#F6DE9A" stroke="#5E4A38" strokeWidth="1.2" /></g>
      </g>

      {/* a few birds crossing the morning sky */}
      <g id="flock" opacity="0" fill="none" stroke="#4E4A40" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <g className="flap"><path d="M0 0 q5 -5 10 0 q5 -5 10 0" /></g>
        <g transform="translate(22 -10) scale(.8)"><g className="flap" style={{ animationDelay: '-.2s' }}><path d="M0 0 q5 -5 10 0 q5 -5 10 0" /></g></g>
        <g transform="translate(40 4) scale(.7)"><g className="flap" style={{ animationDelay: '-.35s' }}><path d="M0 0 q5 -5 10 0 q5 -5 10 0" /></g></g>
      </g>
    </svg>
  )
})

export default LaunchScene
