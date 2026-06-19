export default function StarRating({ label, value }) {
  const display = value === null || value === undefined ? '—' : value
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/55 leading-snug mb-1">
        {label}
      </p>
      <p className="font-display text-3xl font-bold text-white">
        {display}
        {value !== null && value !== undefined && (
          <span className="font-body text-sm font-normal text-white/50"> / 5</span>
        )}
      </p>
    </div>
  )
}
