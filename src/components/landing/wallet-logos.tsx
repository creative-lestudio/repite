/** Iconos simplificados de Apple Wallet y Google Wallet (para mostrar dónde se guarda la tarjeta). */
export function AppleWalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Apple Wallet">
      <rect width="64" height="64" rx="14" fill="#111" />
      <rect x="10" y="12" width="44" height="9" rx="3" fill="#ff453a" />
      <rect x="10" y="19" width="44" height="9" rx="3" fill="#ff9f0a" />
      <rect x="10" y="26" width="44" height="9" rx="3" fill="#ffd60a" />
      <rect x="10" y="33" width="44" height="9" rx="3" fill="#30d158" />
      <rect x="10" y="40" width="44" height="9" rx="3" fill="#0a84ff" />
      <path d="M8 40h48v10a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V40Z" fill="#2c2c2e" />
      <rect x="40" y="44" width="10" height="6" rx="2" fill="#111" />
    </svg>
  );
}

export function GoogleWalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Google Wallet">
      <rect width="64" height="64" rx="14" fill="#fff" />
      <path d="M12 22a6 6 0 0 1 6-6h28a6 6 0 0 1 6 6v3H12v-3Z" fill="#ea4335" />
      <path d="M12 25h40v17a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V25Z" fill="#4285f4" />
      <path d="M12 38h14v10H18a6 6 0 0 1-6-6v-4Z" fill="#34a853" />
      <path d="M40 31h12v11a6 6 0 0 1-6 6h-6V31Z" fill="#fbbc04" />
      <circle cx="44" cy="36" r="3.2" fill="#fff" />
    </svg>
  );
}
