import { motion } from 'framer-motion'

export default function LanguageToggle({ language, setLanguage }) {
  return (
    <div className="flex items-center bg-genesis-charcoal border border-genesis-border rounded-full p-0.5">
      <motion.button
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
          language === 'en'
            ? 'bg-genesis-copper text-black'
            : 'text-genesis-muted hover:text-genesis-silver'
        }`}
        whileTap={{ scale: 0.96 }}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </motion.button>
      <motion.button
        onClick={() => setLanguage('ar')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
          language === 'ar'
            ? 'bg-genesis-copper text-black'
            : 'text-genesis-muted hover:text-genesis-silver'
        }`}
        whileTap={{ scale: 0.96 }}
      >
        <span>🇦🇪</span>
        <span>AR</span>
      </motion.button>
    </div>
  )
}
