import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import WelcomeScreen from './components/WelcomeScreen'
import VehicleSelector from './components/VehicleSelector'
import SpecBoard from './components/SpecBoard'
import VoiceChatbot from './components/VoiceChatbot'
import LanguageToggle from './components/LanguageToggle'

const SCREENS = {
  WELCOME: 'welcome',
  VEHICLES: 'vehicles',
  SPEC_BOARD: 'spec_board',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.WELCOME)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [language, setLanguage] = useState('en') // 'en' or 'ar'

  const openSpecBoard = useCallback((vehicle) => {
    setSelectedVehicle(vehicle)
    setScreen(SCREENS.SPEC_BOARD)
  }, [])

  const openChat = useCallback(() => {
    setChatOpen(true)
  }, [])

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div
      className="relative w-screen h-screen bg-genesis-black overflow-hidden"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Language Toggle — always visible */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageToggle language={language} setLanguage={setLanguage} />
      </div>

      {/* Back button — when not on welcome screen */}
      {screen !== SCREENS.WELCOME && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-6 left-6 z-50 flex items-center gap-2 text-genesis-silver hover:text-white transition-colors text-sm tracking-wider uppercase"
          onClick={() => {
            if (screen === SCREENS.SPEC_BOARD) {
              setScreen(SCREENS.VEHICLES)
              setSelectedVehicle(null)
            } else {
              setScreen(SCREENS.WELCOME)
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {language === 'ar' ? 'رجوع' : 'Back'}
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {screen === SCREENS.WELCOME && (
          <motion.div
            key="welcome"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <WelcomeScreen
              language={language}
              onExplore={() => setScreen(SCREENS.VEHICLES)}
              onChat={() => {
                setChatOpen(true)
              }}
            />
          </motion.div>
        )}

        {screen === SCREENS.VEHICLES && (
          <motion.div
            key="vehicles"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <VehicleSelector
              language={language}
              onSelectVehicle={openSpecBoard}
              onChat={openChat}
            />
          </motion.div>
        )}

        {screen === SCREENS.SPEC_BOARD && selectedVehicle && (
          <motion.div
            key="specboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <SpecBoard
              vehicle={selectedVehicle}
              language={language}
              onChat={openChat}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Chatbot Overlay — always available */}
      <VoiceChatbot
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        language={language}
        currentVehicle={selectedVehicle}
      />

      {/* Floating Chat Button — when chat is closed and not on welcome */}
      {!chatOpen && screen !== SCREENS.WELCOME && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openChat}
          className="absolute bottom-8 right-8 z-40 flex items-center gap-3 bg-genesis-copper text-black px-6 py-3.5 rounded-full shadow-2xl font-medium text-sm tracking-wide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1C7.03 1 3 5.03 3 10C3 11.74 3.5 13.36 4.37 14.73L3 19L7.27 17.63C8.64 18.5 10.26 19 12 19C16.97 19 21 14.97 21 10C21 5.03 16.97 1 12 1Z" fill="currentColor"/>
          </svg>
          {language === 'ar' ? 'تحدث مع Genesis AI' : 'Ask Genesis AI'}
        </motion.button>
      )}
    </div>
  )
}
