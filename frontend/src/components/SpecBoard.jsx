import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { id: 'performance', label: { en: 'Performance', ar: 'الأداء' }, icon: '⚡' },
  { id: 'dimensions', label: { en: 'Dimensions', ar: 'الأبعاد' }, icon: '📐' },
  { id: 'interior', label: { en: 'Interior', ar: 'المقصورة' }, icon: '🪑' },
  { id: 'safety', label: { en: 'Safety', ar: 'السلامة' }, icon: '🛡' },
  { id: 'wheels', label: { en: 'Wheels', ar: 'العجلات' }, icon: '⚙️' },
  { id: 'pricing', label: { en: 'Pricing', ar: 'الأسعار' }, icon: '💎' },
]

function SpecRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-genesis-border/50 last:border-b-0">
      <span className="text-genesis-muted text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right max-w-[55%]">{value}</span>
    </div>
  )
}

export default function SpecBoard({ vehicle, language, onChat }) {
  const [activeTab, setActiveTab] = useState('performance')
  const isArabic = language === 'ar'

  const currentSpecs = vehicle.specs[activeTab] || {}

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Left panel — hero image */}
      <div className="relative w-[45%] h-full flex-shrink-0">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.parentElement.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)'
            e.target.style.display = 'none'
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-genesis-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-genesis-black/70 via-transparent to-transparent" />

        {/* Vehicle name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {vehicle.isElectric && (
              <span className="text-green-400 text-xs tracking-widest uppercase mb-2 block">
                ⚡ {isArabic ? 'كهربائي بالكامل' : 'Fully Electric'}
              </span>
            )}
            <h1 className="font-display text-4xl font-bold text-white mb-1">
              {vehicle.name}
            </h1>
            <p className="text-genesis-copper text-sm tracking-wider">
              {vehicle.type}
            </p>
            <p className="text-genesis-silver/70 text-sm italic mt-2">
              "{vehicle.tagline}"
            </p>

            {/* Starting price */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-genesis-muted text-xs tracking-wider uppercase">
                {isArabic ? 'السعر يبدأ من' : 'Starting from'}
              </span>
              <span className="text-genesis-gold text-lg font-semibold">
                {vehicle.startingPrice}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Highlights pills */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          {vehicle.highlights?.slice(0, 3).map((h, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="bg-black/60 backdrop-blur-sm border border-genesis-copper/30 text-genesis-silver text-xs px-3 py-1.5 rounded-full"
            >
              {h}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Right panel — specs */}
      <div className="flex-1 flex flex-col overflow-hidden bg-genesis-black">
        {/* Tab navigation */}
        <div className="flex-shrink-0 border-b border-genesis-border">
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-4 text-xs font-medium tracking-wider uppercase transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-genesis-copper border-genesis-copper'
                    : 'text-genesis-muted border-transparent hover:text-genesis-silver hover:border-genesis-border'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label[language] || tab.label.en}
              </button>
            ))}
          </div>
        </div>

        {/* Spec content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {Object.entries(currentSpecs).map(([key, value]) => (
                <SpecRow key={key} label={key} value={String(value)} />
              ))}

              {Object.keys(currentSpecs).length === 0 && (
                <div className="text-genesis-muted text-center py-16">
                  <p>Specifications coming soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Competitors */}
        {vehicle.competitors && (
          <div className="flex-shrink-0 px-8 py-4 border-t border-genesis-border">
            <p className="text-genesis-muted text-xs tracking-wider uppercase mb-2">
              {isArabic ? 'المنافسون' : 'Competes with'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {vehicle.competitors.map((c, i) => (
                <span key={i} className="text-xs text-genesis-silver border border-genesis-border px-3 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA bar */}
        <div className="flex-shrink-0 px-8 py-5 border-t border-genesis-border flex gap-3">
          <button
            onClick={onChat}
            className="flex-1 genesis-btn-primary flex items-center justify-center gap-2 py-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1C7.03 1 3 5.03 3 10C3 11.74 3.5 13.36 4.37 14.73L3 19L7.27 17.63C8.64 18.5 10.26 19 12 19C16.97 19 21 14.97 21 10C21 5.03 16.97 1 12 1Z"/>
            </svg>
            {isArabic ? 'اسأل Genesis AI عن هذه السيارة' : 'Ask Genesis AI About This Vehicle'}
          </button>
          <button className="genesis-btn py-3 px-5 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {isArabic ? 'تجربة قيادة' : 'Test Drive'}
          </button>
        </div>
      </div>
    </div>
  )
}
