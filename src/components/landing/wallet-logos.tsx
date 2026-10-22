/** Iconos de Apple Wallet y Google Wallet (redibujados en vectorial a partir de los iconos de las apps). */
export function AppleWalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Apple Wallet">
      <rect width="300" height="300" rx="68" fill="#1c1c1e" />
      <rect x="64" y="84" width="172" height="70" rx="14" fill="#3b95e8" />
      <rect x="64" y="100" width="172" height="70" rx="14" fill="#f9b21e" />
      <rect x="64" y="116" width="172" height="70" rx="14" fill="#56bf4d" />
      <rect x="64" y="132" width="172" height="70" rx="14" fill="#f4766b" />
      <path
        d="M64 160c0-8 6-14 14-14h46c9 0 14 6 18 14 5 10 12 18 22 18h14c10 0 17-8 22-18 4-8 9-14 18-14h4c8 0 14 6 14 14v50c0 9-7 16-16 16H80c-9 0-16-7-16-16v-50Z"
        fill="#dcd9cf"
      />
    </svg>
  );
}

export function GoogleWalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 2000 1730" className={className} role="img" aria-label="Google Wallet">
      <defs>
        <linearGradient id="gw-blue" x1="0.2" y1="0.2" x2="0.8" y2="1">
          <stop offset="0" stopColor="#4f8bff" />
          <stop offset="0.35" stopColor="#3084ff" />
          <stop offset="1" stopColor="#3084ff" />
        </linearGradient>
        <radialGradient id="gw-glow" cx="0.68" cy="0.5" r="0.4">
          <stop offset="0" stopColor="#7a8bff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#7a8bff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M0 385C0 172 172 0 385 0h1230c213 0 385 172 385 385v1000H0V385Z" fill="#00b058" />
      <path d="M0 635C0 422 172 250 385 250h1230c213 0 385 172 385 385v900H0V635Z" fill="#fcc900" />
      <path d="M0 885c0-213 172-385 385-385h1230c213 0 385 172 385 385v600H0V885Z" fill="#fa4341" />
      <path
        d="M0 727l1250 308c200 45 370 25 490-95l260-225v645c0 200-170 370-370 370H370c-205 0-370-170-370-370V727Z"
        fill="url(#gw-blue)"
      />
      <path
        d="M0 727l1250 308c200 45 370 25 490-95l260-225v645c0 200-170 370-370 370H370c-205 0-370-170-370-370V727Z"
        fill="url(#gw-glow)"
      />
    </svg>
  );
}
