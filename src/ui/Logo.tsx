export function Logo() {
  return (
    <svg width="40" height="28" viewBox="0 0 40 28" aria-hidden="true" focusable="false">
      <ellipse
        cx="20"
        cy="14"
        rx="17"
        ry="9"
        fill="none"
        stroke="var(--couleur-ellipse)"
        strokeWidth="3"
        transform="rotate(-12 20 14)"
      />
      <circle cx="22" cy="13" r="6" fill="var(--accent)" />
    </svg>
  );
}
