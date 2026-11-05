// A small flat composition to start from: two grounds, a split disc, a small
// circle for an apex, and diagonal bands. Any SVG of filled shapes works the same.
export const CONTINUUM_SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect x="0" y="0" width="300" height="400" fill="#999"/>
  <rect x="300" y="0" width="300" height="400" fill="#aaa"/>
  <polygon points="0,300 600,170 600,250 0,380" fill="#bbb"/>
  <polygon points="0,380 600,250 600,330 0,400" fill="#ccc"/>
  <polygon points="420,0 600,0 600,120" fill="#ddd"/>
  <path d="M300,70 A130,130 0 0 0 300,330 Z" fill="#666"/>
  <path d="M300,70 A130,130 0 0 1 300,330 Z" fill="#777"/>
  <circle cx="255" cy="150" r="30" fill="#eee"/>
</svg>`;
