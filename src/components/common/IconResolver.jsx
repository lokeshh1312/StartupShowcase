import React from 'react';
import {
  Activity,
  Layers,
  KeyRound,
  Sparkles,
  Database,
  Clock,
  Globe,
  Mic,
  Server,
  Palette,
  Video,
  BookOpen,
  CheckSquare,
  Cpu,
  FileText,
  Fingerprint,
  Rocket,
  Terminal,
  Zap,
  CreditCard,
  Users,
  TrendingUp,
  ShieldCheck,
  Compass,
  FolderGit2
} from 'lucide-react';

const ICON_MAP = {
  Activity,
  Layers,
  KeyRound,
  Sparkles,
  Database,
  Clock,
  Globe,
  Mic,
  Server,
  Palette,
  Video,
  BookOpen,
  CheckSquare,
  Cpu,
  FileText,
  Fingerprint,
  Rocket,
  Terminal,
  Zap,
  CreditCard,
  Users,
  TrendingUp,
  ShieldCheck,
  Compass,
  FolderGit2
};

export const IconResolver = ({ name, className = 'w-5 h-5' }) => {
  const Component = ICON_MAP[name] || Rocket;
  return <Component className={className} />;
};
