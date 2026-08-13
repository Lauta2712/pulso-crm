// The needle: two triangles meeting at a point, one filled (the tip that
// points), one hollow (the tail). It's the brand's signature shape — every
// other use of it (favicon, emails) should stay this same silhouette.
export default function CompassMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 3.5 4 16l12 12.5" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 3.5 28 16 16 28.5" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
