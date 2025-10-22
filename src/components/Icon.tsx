
interface IconProps {
  name: 'logo' | 'dashboard' | 'entreprises' | 'prestations' | 'planning' | 'paiements' | 'documents';
  size?: 16 | 24 | 32 | 48 | 64;
  className?: string;
}

// Couleurs distinctes pour chaque menu (plus simples)
const ICON_STYLES = {
  logo: {
    filter: 'brightness(0) saturate(100%) invert(1)', // Blanc
    opacity: 1
  },
  dashboard: {
    filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)', // Rouge
    opacity: 1
  },
  entreprises: {
    filter: 'brightness(0) saturate(100%) invert(11%) sepia(100%) saturate(4456%) hue-rotate(240deg) brightness(99%) contrast(124%)', // Bleu foncé
    opacity: 1
  },
  prestations: {
    filter: 'brightness(0) saturate(100%) invert(64%) sepia(98%) saturate(1739%) hue-rotate(87deg) brightness(96%) contrast(105%)', // Vert
    opacity: 1
  },
  planning: {
    filter: 'brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(2223%) hue-rotate(262deg) brightness(92%) contrast(143%)', // Violet
    opacity: 1
  },
  paiements: {
    filter: 'brightness(0) saturate(100%) invert(60%) sepia(96%) saturate(1815%) hue-rotate(21deg) brightness(101%) contrast(101%)', // Orange
    opacity: 1
  },
  documents: {
    filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(87deg) brightness(119%) contrast(119%)', // Vert foncé
    opacity: 1
  }
};

// Tailles disponibles pour chaque icône
const SIZE_MAPPING = {
  16: '/logo16.png',
  24: '/logo32.png',
  32: '/logo32.png',
  48: '/logo48.png',
  64: '/logo64.png'
};

export function Icon({ name, size = 24, className = '' }: IconProps) {
  // Utiliser la taille appropriée
  const iconSrc = SIZE_MAPPING[size] || SIZE_MAPPING[24];
  const iconStyle = ICON_STYLES[name] || ICON_STYLES.logo;

  return (
    <img
      src={iconSrc}
      alt={`Icône ${name}`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{
        objectFit: 'contain',
        ...iconStyle
      }}
      onError={(e) => {
        console.warn(`⚠️ Icône ${name} non disponible (mode hors ligne)`);
        // Masquer l'image cassée
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

// Composant pour l'icône principale de l'app
export function AppIcon({ size = 48, className = '' }: { size?: number; className?: string }) {
  // Choisir la bonne taille selon le size demandé
  const getIconSize = (requestedSize: number) => {
    if (requestedSize <= 16) return '/logo16.png';
    if (requestedSize <= 32) return '/logo32.png';
    if (requestedSize <= 48) return '/logo48.png';
    if (requestedSize <= 64) return '/logo64.png';
    if (requestedSize <= 96) return '/logo96.png';
    if (requestedSize <= 128) return '/logo128.png';
    if (requestedSize <= 192) return '/logo192.png';
    if (requestedSize <= 256) return '/logo256.png';
    if (requestedSize <= 384) return '/logo384.png';
    return '/logo512.png';
  };

  return (
    <img
      src={getIconSize(size)}
      alt="Suivi de Chantier"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ objectFit: 'contain' }}
      onError={(e) => {
        console.warn(`⚠️ Logo non disponible (mode hors ligne), utilisation fallback`);
        // Masquer l'image cassée
        (e.target as HTMLImageElement).style.display = 'none';
      }}
      onLoad={() => {
        console.log(`✅ AppIcon taille ${size} chargée`);
      }}
    />
  );
}
