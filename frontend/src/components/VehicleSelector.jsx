import { useState } from 'react'
import { motion } from 'framer-motion'
import VehicleCard from './VehicleCard'
import vehiclesData from '../data/vehicles.json'

const FILTERS = [
  { id: 'all', label: { en: 'All Models', ar: 'جميع الموديلات' } },
  { id: 'sedan', label: { en: 'Sedans', ar: 'سيدان' } },
  { id: 'suv', label: { en: 'SUVs', ar: 'دفع رباعي' } },
  { id: 'electric', label: { en: 'Electric', ar: 'كهربائي' } },
]

function filterVehicles(vehicles, filterId) {
  if (filterId === 'all') return vehicles
  if (filterId === 'electric') return vehicles.filter(v => v.isElectric)
  if (filterId === 'sedan') return vehicles.filter(v => v.type.toLowerCase().includes('sedan'))
  if (filterId === 'suv') return vehicles.filter(v => v.type.toLowerCase().includes('suv'))
  return vehicles
}

export default function VehicleSelector({ language, onSelectVehicle, onChat }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const isArabic = language === 'ar'

  const filtered = filterVehicles(vehiclesData, activeFilter)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-10 pt-16 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-genesis-copper text-xs tracking-[0.3em] uppercase mb-2">
            {isArabic ? 'المجموعة الكاملة' : 'Complete Lineup'}
          </p>
          <h2 className="font-display text-3xl font-semibold text-white">
            {isArabic ? 'اختر سيارتك' : 'Select Your Genesis'}
          </h2>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-2 mt-6"
        >
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase transition-all duration-200 ${
                activeFilter === filter.id
                  ? 'bg-genesis-copper text-black'
                  : 'border border-genesis-border text-genesis-muted hover:border-genesis-copper/50 hover:text-genesis-silver'
              }`}
            >
              {filter.label[language] || filter.label.en}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Vehicle Grid — scrollable */}
      <div className="flex-1 overflow-y-auto px-10 pb-8 no-scrollbar">
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              index={index}
              language={language}
              onClick={onSelectVehicle}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-genesis-muted">
            <p className="text-lg">No vehicles found</p>
          </div>
        )}
      </div>

      {/* Bottom stat bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex-shrink-0 border-t border-genesis-border px-10 py-4 flex items-center justify-between"
      >
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-genesis-copper text-lg font-semibold">9</p>
            <p className="text-genesis-muted text-xs tracking-wider uppercase">
              {isArabic ? 'موديلات' : 'Models'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-genesis-copper text-lg font-semibold">3</p>
            <p className="text-genesis-muted text-xs tracking-wider uppercase">
              {isArabic ? 'كهربائية' : 'Electric'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-genesis-copper text-lg font-semibold">5yr</p>
            <p className="text-genesis-muted text-xs tracking-wider uppercase">
              {isArabic ? 'ضمان' : 'Warranty'}
            </p>
          </div>
        </div>
        <p className="text-genesis-muted text-xs">
          {isArabic ? 'انقر على أي سيارة لعرض المواصفات الكاملة' : 'Tap any vehicle to view full specifications'}
        </p>
      </motion.div>
    </div>
  )
}
