import {
  BarChart3,
  Building2,
  Users,
  Calendar,
  CreditCard,
  Shield,
  MessageCircle,
  CheckSquare
} from 'lucide-react';

interface NavigationIconProps {
  type: 'dashboard' | 'entreprises' | 'prestations' | 'planning' | 'etapes' | 'paiements' | 'documents' | 'chat';
  isActive?: boolean;
  size?: number;
}

// Mapping des icônes et couleurs par type
const ICON_CONFIG = {
  dashboard: {
    icon: BarChart3,
    bgColor: 'bg-red-500',
    textColor: 'text-white'
  },
  entreprises: {
    icon: Building2,
    bgColor: 'bg-blue-600',
    textColor: 'text-white'
  },
  prestations: {
    icon: Users,
    bgColor: 'bg-green-500',
    textColor: 'text-white'
  },
  planning: {
    icon: Calendar,
    bgColor: 'bg-purple-500',
    textColor: 'text-white'
  },
  etapes: {
    icon: CheckSquare,
    bgColor: 'bg-indigo-600',
    textColor: 'text-white'
  },
  paiements: {
    icon: CreditCard,
    bgColor: 'bg-orange-500',
    textColor: 'text-white'
  },
  documents: {
    icon: Shield,
    bgColor: 'bg-emerald-600',
    textColor: 'text-white'
  },
  chat: {
    icon: MessageCircle,
    bgColor: 'bg-purple-500',
    textColor: 'text-white'
  }
};

export function NavigationIcon({ type, isActive = false, size = 24 }: NavigationIconProps) {
  const config = ICON_CONFIG[type];
  const IconComponent = config.icon;

  return (
    <div className={`
      relative rounded-lg p-2 transition-all
      ${config.bgColor}
      ${isActive ? 'ring-2 ring-white ring-opacity-50' : 'hover:brightness-110'}
    `}>
      <IconComponent
        className={`
          w-5 h-5 transition-all
          ${config.textColor}
        `}
      />
    </div>
  );
}
