import { motion } from 'framer-motion'

const GenesisLogo = () => (
  <h1
    className="font-display font-semibold tracking-[0.25em] text-5xl"
    style={{
      background: 'linear-gradient(135deg, #C4956A 0%, #D4AF37 50%, #C4956A 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}
  >
    GENESIS
  </h1>
)

export default function WelcomeScreen({ language, onExplore, onChat }) {
  const isArabic = language === 'ar'

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#1a1208] via-genesis-black to-genesis-black" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(196,149,106,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(196,149,106,0.3) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Animated orb background */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(196,149,106,0.08) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-3"
        >
          <GenesisLogo />
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="w-24 h-px bg-gradient-to-r from-transparent via-genesis-copper to-transparent mb-8"
        />

        {/* Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="font-display text-4xl md:text-5xl text-white font-light mb-3 leading-tight"
        >
          {isArabic ? 'تجربة Genesis الشخصية' : 'Your Personal'}
          <br />
          <span className="text-gradient-copper font-semibold italic">
            {isArabic ? '' : 'Genesis Experience'}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-genesis-muted text-sm tracking-widest uppercase mb-16 font-light"
        >
          {isArabic ? 'صُنع للاستثنائي' : 'Crafted for the exceptional'}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExplore}
            className="genesis-btn-primary min-w-[220px] text-center"
          >
            {isArabic ? 'استعرض سياراتنا' : 'Explore Our Vehicles'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onChat}
            className="genesis-btn min-w-[220px] text-center flex items-center justify-center gap-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1C7.03 1 3 5.03 3 10v1a1 1 0 002 0v-1c0-3.86 3.14-7 7-7s7 3.14 7 7v1a1 1 0 002 0v-1c0-4.97-4.03-9-9-9z" />
            </svg>
            {isArabic ? 'تحدث مع Genesis AI' : 'Talk to Genesis AI'}
          </motion.button>
        </motion.div>

        {/* Bottom indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20 flex flex-col items-center gap-2"
        >
          <span className="text-genesis-muted text-xs tracking-widest uppercase">
            {isArabic ? 'متاح في دبي • أبوظبي • الشارقة' : 'Available in Dubai • Abu Dhabi • Sharjah'}
          </span>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-genesis-copper"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-genesis-copper opacity-20" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-genesis-copper opacity-20" />
    </div>
  )
}
