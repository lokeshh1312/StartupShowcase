import React from 'react';
import { 
  Sprout, 
  Cross, 
  Package, 
  GraduationCap, 
  UtensilsCrossed, 
  Scale, 
  Sun, 
  Activity, 
  Droplet, 
  Users, 
  Coins, 
  Zap, 
  Compass, 
  Cpu, 
  Leaf,
  Layers,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export const StartupLogo = ({ startup, size = 'md', showName = true, className = '' }) => {
  if (!startup) return null;

  const getLogoConfig = (slug, category, logoType) => {
    switch (slug?.toLowerCase()) {
      case 'agrisense':
        return {
          icon: <Leaf className="w-5 h-5 text-emerald-600" />,
          colorClass: 'text-emerald-700',
          bgClass: 'bg-emerald-50 border-emerald-100',
          displayName: 'AgriSense'
        };
      case 'medease':
        return {
          icon: <Stethoscope className="w-5 h-5 text-sky-600" />,
          colorClass: 'text-sky-700',
          bgClass: 'bg-sky-50 border-sky-100',
          displayName: 'MedEase'
        };
      case 'ecopack':
        return {
          icon: <Package className="w-5 h-5 text-green-600" />,
          colorClass: 'text-green-700',
          bgClass: 'bg-green-50 border-green-100',
          displayName: 'EcoPack'
        };
      case 'learnnext':
        return {
          icon: <GraduationCap className="w-5 h-5 text-purple-600" />,
          colorClass: 'text-purple-700',
          bgClass: 'bg-purple-50 border-purple-100',
          displayName: 'LearnNext'
        };
      case 'bhojankart':
        return {
          icon: <UtensilsCrossed className="w-5 h-5 text-orange-600" />,
          colorClass: 'text-orange-700',
          bgClass: 'bg-orange-50 border-orange-100',
          displayName: 'BhojanKart'
        };
      case 'lawassist':
        return {
          icon: <Scale className="w-5 h-5 text-violet-600" />,
          colorClass: 'text-violet-700',
          bgClass: 'bg-violet-50 border-violet-100',
          displayName: 'LawAssist'
        };
      case 'sunroof':
        return {
          icon: <Sun className="w-5 h-5 text-amber-500" />,
          colorClass: 'text-amber-700',
          bgClass: 'bg-amber-50 border-amber-100',
          displayName: 'SunRoof'
        };
      case 'welltrack':
        return {
          icon: <Activity className="w-5 h-5 text-sky-600" />,
          colorClass: 'text-sky-700',
          bgClass: 'bg-sky-50 border-sky-100',
          displayName: 'WellTrack'
        };
      case 'jalsuraksha':
        return {
          icon: <Droplet className="w-5 h-5 text-blue-600" />,
          colorClass: 'text-blue-700',
          bgClass: 'bg-blue-50 border-blue-100',
          displayName: 'JalSuraksha'
        };
      case 'skillsetu':
        return {
          icon: <Users className="w-5 h-5 text-fuchsia-600" />,
          colorClass: 'text-fuchsia-700',
          bgClass: 'bg-fuchsia-50 border-fuchsia-100',
          displayName: 'SkillSetu'
        };
      case 'finsetu':
        return {
          icon: <Coins className="w-5 h-5 text-amber-600" />,
          colorClass: 'text-amber-700',
          bgClass: 'bg-amber-50 border-amber-100',
          displayName: 'FinSetu'
        };
      case 'kisandost':
        return {
          icon: <Sprout className="w-5 h-5 text-emerald-600" />,
          colorClass: 'text-emerald-700',
          bgClass: 'bg-emerald-50 border-emerald-100',
          displayName: 'KisanDost'
        };
      case 'evchargex':
        return {
          icon: <Zap className="w-5 h-5 text-blue-600" />,
          colorClass: 'text-blue-700',
          bgClass: 'bg-blue-50 border-blue-100',
          displayName: 'EVChargeX'
        };
      case 'dronair':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          colorClass: 'text-emerald-700',
          bgClass: 'bg-emerald-50 border-emerald-100',
          displayName: 'DronAir'
        };
      case 'niramay':
        return {
          icon: <Stethoscope className="w-5 h-5 text-sky-600" />,
          colorClass: 'text-sky-700',
          bgClass: 'bg-sky-50 border-sky-100',
          displayName: 'Niramay'
        };
      default:
        // Default fallback based on category
        const cat = category?.toLowerCase() || '';
        let icon = <Cpu className="w-5 h-5 text-blue-600" />;
        let col = 'text-blue-700';
        let bg = 'bg-blue-50 border-blue-100';

        if (cat.includes('agri')) {
          icon = <Leaf className="w-5 h-5 text-emerald-600" />;
          col = 'text-emerald-700';
          bg = 'bg-emerald-50 border-emerald-100';
        } else if (cat.includes('health')) {
          icon = <Activity className="w-5 h-5 text-sky-600" />;
          col = 'text-sky-700';
          bg = 'bg-sky-50 border-sky-100';
        } else if (cat.includes('clean') || cat.includes('green')) {
          icon = <Sun className="w-5 h-5 text-green-600" />;
          col = 'text-green-700';
          bg = 'bg-green-50 border-green-100';
        } else if (cat.includes('food')) {
          icon = <UtensilsCrossed className="w-5 h-5 text-orange-600" />;
          col = 'text-orange-700';
          bg = 'bg-orange-50 border-orange-100';
        } else if (cat.includes('ed')) {
          icon = <GraduationCap className="w-5 h-5 text-purple-600" />;
          col = 'text-purple-700';
          bg = 'bg-purple-50 border-purple-100';
        } else if (cat.includes('legal')) {
          icon = <Scale className="w-5 h-5 text-violet-600" />;
          col = 'text-violet-700';
          bg = 'bg-violet-50 border-violet-100';
        } else if (cat.includes('water')) {
          icon = <Droplet className="w-5 h-5 text-blue-600" />;
          col = 'text-blue-700';
          bg = 'bg-blue-50 border-blue-100';
        } else if (cat.includes('skill')) {
          icon = <Users className="w-5 h-5 text-fuchsia-600" />;
          col = 'text-fuchsia-700';
          bg = 'bg-fuchsia-50 border-fuchsia-100';
        }

        return {
          icon,
          colorClass: col,
          bgClass: bg,
          displayName: startup.name
        };
    }
  };

  const config = getLogoConfig(startup.slug, startup.category, startup.logoType);

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div 
        className={`flex items-center justify-center rounded-xl p-2 transition-transform duration-200 group-hover:scale-105 ${config.bgClass}`}
        style={{ width: size === 'lg' ? '48px' : size === 'sm' ? '32px' : '40px', height: size === 'lg' ? '48px' : size === 'sm' ? '32px' : '40px' }}
      >
        {config.icon}
      </div>
      {showName && (
        <span className={`text-[11px] font-semibold mt-1 tracking-tight text-slate-800 line-clamp-1`}>
          {config.displayName}
        </span>
      )}
    </div>
  );
};
