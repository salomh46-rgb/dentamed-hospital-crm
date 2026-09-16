import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { Gift, ArrowRight, Stethoscope, Sparkles } from 'lucide-react';
import { BorderBeam } from './BorderBeam';
import { triggerHaptic } from '../utils/telegramAlerts';

interface CrossPromoBannerProps {
  lang: Language;
  onClaim: () => void;
  tenantId?: string;
}

export const CrossPromoBanner: React.FC<CrossPromoBannerProps> = ({ lang, onClaim, tenantId = 'dentamed' }) => {
  const [promo, setPromo] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/tenants/${tenantId}/promo`)
      .then(res => res.json())
      .then(data => {
        if (data) setPromo(data);
      })
      .catch(() => {});
  }, [tenantId]);

  const badge = promo?.badgeUz || (tenantId === 'grandmed' ? 'Eksklyuziv GrandMed Taklifi' : 'Eksklyuziv Atelier Taklifi');
  const title = promo?.titleUz || (tenantId === 'grandmed' 
    ? "GrandMed: Shveysariya Implanti o'rnatganlarga 3D Tomografiya 100% BEPUL!"
    : "Tish davolatganga LOR ko'rigi — 50% Imtiyoz");
  const desc = promo?.descUz || (tenantId === 'grandmed'
    ? "Shveysariya texnologiyasi asosida to'liq tish qatorini 1 kunda tiklang va bepul 3D konsultatsiyaga ega bo'ling."
    : "Gaymorit va tish kanallari o'zaro bog'liq. Shveysariya protokoli bo'yicha kompleks tashxisdan o'ting.");

  const handleClaim = () => {
    triggerHaptic('medium');
    onClaim();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#112E24] dark:bg-[#0A1D16] border border-[#C5A880]/30 dark:border-[#C5A880]/40 p-5 sm:p-6 text-[#FAF8F5] shadow-luxury-md mb-6">
      {/* 2026 Rotating Border Beam Neon Effect */}
      <BorderBeam size={220} duration={8} colorFrom="#C5A880" colorTo="#183F32" />

      {/* Background luxury glow and watermark */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#C5A880]/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-4 top-4 text-[#C5A880]/15 pointer-events-none">
        <Stethoscope className="w-20 h-20" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#D6BF9F] px-3 py-1 rounded-full text-[10.5px] font-semibold tracking-wider uppercase mb-2.5 shadow-sm">
          <Gift className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>{badge}</span>
        </div>

        <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug mb-1.5 text-[#FAF8F5] max-w-md tracking-tight">
          {title}
        </h3>

        <p className="text-xs text-[#FAF8F5]/80 mb-4 max-w-md leading-relaxed font-sans font-light">
          {desc}
        </p>

        <button
          onClick={handleClaim}
          className="inline-flex items-center gap-2 bg-[#C5A880] hover:bg-[#D6BF9F] active:scale-[0.98] text-[#112E24] min-h-[44px] px-5 py-2.5 rounded-full font-bold text-xs tracking-wide shadow-luxury-sm hover:shadow-luxury-md transition-all duration-150 group"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#112E24] transition-transform duration-300 group-hover:rotate-12" />
          <span>{lang === 'uz' ? 'Imtiyoz bilan yozilish' : 'Записаться по привилегии'}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
