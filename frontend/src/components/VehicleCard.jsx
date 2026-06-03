import { motion } from 'framer-motion'

const BADGE_COLORS = {
  Sport: 'bg-red-900 text-red-300',
  Executive: 'bg-blue-900 text-blue-300',
  Flagship: 'bg-yellow-900 text-yellow-300',
  Electric: 'bg-green-900 text-green-300',
  Popular: 'bg-genesis-copper text-black',
  Family: 'bg-purple-900 text-purple-300',
  Coupe: 'bg-orange-900 text-orange-300',
}

export default function VehicleCard({ vehicle, onClick, index, language }) {
  const isArabic = language === 'ar'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => onClick(vehicle)}
      className="group relative bg-genesis-charcoal border border-genesis-border rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:border-genesis-copper/50"
    >
      {/* Vehicle image */}
      <div className="relative h-44 overflow-hidden bg-genesis-dark">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.parentElement.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)'
          }}
        />

        {/* Badge */}
        {vehicle.badge && (
          <div className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'}`}>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full tracking-wider uppercase ${BADGE_COLORS[vehicle.badge] || 'bg-genesis-copper text-black'}`}>
              {vehicle.isElectric && vehicle.badge === 'Electric' ? '⚡ ' : ''}{vehicle.badge}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-genesis-charcoal via-transparent to-transparent" />
      </div>

      {/* Card content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-white font-semibold text-base group-hover:text-genesis-copper transition-colors">
              {vehicle.name}
            </h3>
            <p className="text-genesis-muted text-xs mt-0.5 tracking-wide">
              {vehicle.type}
            </p>
          </div>
          <div className="text-right">
            <p className="text-genesis-copper text-xs font-medium">
              {isArabic ? 'من' : 'from'}
            </p>
            <p className="text-white text-sm font-semibold">
              {vehicle.startingPrice}
            </p>
          </div>
        </div>

        <p className="text-genesis-silver text-xs italic mt-2 mb-3 opacity-70 line-clamp-1">
          "{vehicle.tagline}"
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-genesis-border mb-3" />

        {/* View details */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {vehicle.highlights?.slice(0, 2).map((h, i) => (
              <span key={i} className="text-xs text-genesis-muted bg-genesis-dark px-2 py-0.5 rounded-full truncate max-w-[80px]">
                {h}
              </span>
            ))}
          </div>
          <span className="text-genesis-copper text-xs font-medium tracking-wider uppercase flex items-center gap-1">
            {isArabic ? 'عرض' : 'View'}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5H8M8 5L5 2M8 5L5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
      </div>

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-genesis-copper to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}
