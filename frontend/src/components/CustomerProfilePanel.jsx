import { motion } from 'framer-motion'

const SCORE_COLORS = {
  cold: { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700/40', dot: 'bg-blue-400' },
  warm: { bg: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-700/40', dot: 'bg-amber-400' },
  hot: { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-700/40', dot: 'bg-red-400' },
}

const INTENT_LABELS = {
  browsing: { label: 'Browsing', color: 'text-genesis-muted' },
  comparing: { label: 'Comparing', color: 'text-blue-300' },
  high_interest: { label: 'High Interest', color: 'text-amber-300' },
  ready_to_buy: { label: 'Ready to Buy', color: 'text-green-300' },
}

export default function CustomerProfilePanel({ profile }) {
  if (!profile) return null

  const score = SCORE_COLORS[profile.lead_score] || SCORE_COLORS.cold
  const intent = INTENT_LABELS[profile.intent] || INTENT_LABELS.browsing

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-genesis-panel border border-genesis-border rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-genesis-border flex items-center justify-between">
        <p className="text-genesis-copper text-xs tracking-widest uppercase font-medium">
          Customer Profile
        </p>
        {/* Lead score badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${score.bg} ${score.text} ${score.border}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${score.dot} animate-pulse`} />
          {(profile.lead_score || 'cold').toUpperCase()}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Intent */}
        <div>
          <p className="text-genesis-muted text-xs mb-1 uppercase tracking-wider">Intent</p>
          <p className={`text-sm font-medium ${intent.color}`}>
            {intent.label}
          </p>
        </div>

        {/* Vehicle preferences */}
        {profile.vehicle_preferences?.length > 0 && (
          <div>
            <p className="text-genesis-muted text-xs mb-2 uppercase tracking-wider">Interested In</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.vehicle_preferences.map((v, i) => (
                <span key={i} className="text-xs bg-genesis-dark border border-genesis-border text-genesis-silver px-2 py-0.5 rounded-full">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Priorities */}
        {profile.priorities?.length > 0 && (
          <div>
            <p className="text-genesis-muted text-xs mb-2 uppercase tracking-wider">Priorities</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.priorities.map((p, i) => (
                <span key={i} className="text-xs bg-genesis-copper/10 border border-genesis-copper/20 text-genesis-copper px-2 py-0.5 rounded-full capitalize">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Budget */}
        {profile.budget_level && (
          <div>
            <p className="text-genesis-muted text-xs mb-1 uppercase tracking-wider">Budget Range</p>
            <p className="text-sm text-white capitalize">{profile.budget_level} tier</p>
          </div>
        )}

        {/* Recommended action */}
        {profile.recommended_action && (
          <div className="border-t border-genesis-border pt-3">
            <p className="text-genesis-muted text-xs mb-1 uppercase tracking-wider">Suggested Action</p>
            <p className="text-genesis-copper text-xs font-medium capitalize">
              {profile.recommended_action.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        {/* Insight */}
        {profile.conversation_insights && (
          <div className="bg-genesis-dark rounded px-3 py-2">
            <p className="text-genesis-muted text-xs italic leading-relaxed">
              "{profile.conversation_insights}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
