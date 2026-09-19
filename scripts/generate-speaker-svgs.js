const fs = require('fs');
const path = require('path');

const speakers = [
  { id: '1', name: 'Upasana Kamineni', org: 'Apollo Foundation & URLife', role: 'VC & Managing Director', color: '#38BDF8' },
  { id: '2', name: 'Anup Gupta', org: 'MathonGo', role: 'Founder & CEO', color: '#10B981' },
  { id: '3', name: 'Ashish Arora', org: 'Physics Galaxy', role: 'Founder & Chief Mentor', color: '#F59E0B' },
  { id: '4', name: 'Akhil Gupta', org: 'NoBroker', role: 'Founder & Tech Lead', color: '#6366F1' },
  { id: '5', name: 'Ranveer Allahbadia', org: 'Monk Entertainment', role: 'Co-Founder & Podcaster', color: '#EC4899' },
  { id: '6', name: 'Dr. R. A. Mashelkar', org: 'National Innovation Foundation', role: 'Eminent Scientist & Mentor', color: '#38BDF8' }
];

speakers.forEach(s => {
  const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const svg = `<svg width="600" height="800" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow-${s.id}" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="${s.color}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#080A0F" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="grad-${s.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#151B26" stop-opacity="0.2"/>
      <stop offset="55%" stop-color="#080A0F" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#080A0F" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="#0D111A"/>
  <rect width="600" height="800" fill="url(#glow-${s.id})"/>

  <g opacity="0.18">
    <line x1="60" y1="0" x2="60" y2="800" stroke="#F5F7FA" stroke-width="1" stroke-dasharray="4 8"/>
    <line x1="540" y1="0" x2="540" y2="800" stroke="#F5F7FA" stroke-width="1" stroke-dasharray="4 8"/>
    <circle cx="300" cy="340" r="180" stroke="${s.color}" stroke-width="1" opacity="0.3"/>
    <circle cx="300" cy="340" r="230" stroke="#151B26" stroke-width="2"/>
  </g>

  <g transform="translate(300, 320)">
    <circle cx="0" cy="-40" r="72" fill="#151B26" stroke="${s.color}" stroke-width="3" stroke-opacity="0.7"/>
    <path d="M-115 110 C -105 40, -50 20, 0 20 C 50 20, 105 40, 115 110 Z" fill="#151B26" stroke="${s.color}" stroke-width="2" stroke-opacity="0.4"/>
    <text x="0" y="-28" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="${s.color}">${initials}</text>
  </g>

  <rect width="600" height="800" fill="url(#grad-${s.id})"/>

  <rect x="40" y="40" width="130" height="28" rx="14" fill="#151B26" stroke="${s.color}" stroke-opacity="0.4"/>
  <text x="105" y="58" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="${s.color}" letter-spacing="1.5">IEDC SPEAKER</text>
</svg>`;
  fs.writeFileSync(path.join('public', 'images', 'placeholders', `speaker-${s.id}.svg`), svg);
});
console.log('Speaker placeholder SVGs written successfully.');
