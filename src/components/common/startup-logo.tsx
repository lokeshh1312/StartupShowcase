import React from "react";
import Image from "next/image";
import {
  Package,
  GraduationCap,
  Scale,
  Sun,
  Droplet,
  Users,
  Coins,
  Cpu,
  Leaf,
  Stethoscope,
  Rocket,
} from "lucide-react";

interface StartupLogoProps {
  name: string;
  category?: string;
  logoType?: string | null;
  logoColor?: string | null;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function StartupLogo({
  name,
  category,
  logoType,
  logoColor = "#2563EB",
  logoUrl,
  size = "md",
  className = "",
}: StartupLogoProps) {
  const getIcon = () => {
    const type = (logoType || "").toLowerCase();
    const cat = (category || "").toLowerCase();

    if (type.includes("sprout") || type.includes("leaf") || cat.includes("agri")) {
      return <Leaf className="w-full h-full" />;
    }
    if (type.includes("steth") || cat.includes("health") || cat.includes("med")) {
      return <Stethoscope className="w-full h-full" />;
    }
    if (type.includes("package") || cat.includes("supply") || cat.includes("logistic")) {
      return <Package className="w-full h-full" />;
    }
    if (type.includes("grad") || cat.includes("edtech") || cat.includes("education")) {
      return <GraduationCap className="w-full h-full" />;
    }
    if (type.includes("scale") || cat.includes("legal")) {
      return <Scale className="w-full h-full" />;
    }
    if (type.includes("sun") || cat.includes("clean") || cat.includes("climate") || cat.includes("energy")) {
      return <Sun className="w-full h-full" />;
    }
    if (type.includes("coin") || cat.includes("fintech") || cat.includes("finance")) {
      return <Coins className="w-full h-full" />;
    }
    if (type.includes("cpu") || cat.includes("ai") || cat.includes("deep tech")) {
      return <Cpu className="w-full h-full" />;
    }
    if (type.includes("droplet") || cat.includes("water")) {
      return <Droplet className="w-full h-full" />;
    }
    if (type.includes("user") || cat.includes("hr") || cat.includes("community")) {
      return <Users className="w-full h-full" />;
    }

    return <Rocket className="w-full h-full" />;
  };

  const sizeClasses = {
    sm: "w-9 h-9 p-2 rounded-xl text-sm",
    md: "w-11 h-11 p-2.5 rounded-2xl text-base",
    lg: "w-16 h-16 p-3.5 rounded-2xl text-xl",
    xl: "w-20 h-20 p-4 rounded-3xl text-2xl",
  };

  const initial = (name || "S").charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 font-bold border border-slate-200/80 dark:border-slate-800 shadow-xs transition-transform duration-200 ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${logoColor || "#2563EB"}15`,
        color: logoColor || "#2563EB",
      }}
      aria-label={`${name} logo`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 48px, 80px"
          className="object-cover rounded-inherit"
        />
      ) : logoType ? (
        getIcon()
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
