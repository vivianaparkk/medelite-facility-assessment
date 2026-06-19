export default function FieldRow({ label, value, onChange, placeholder, readOnly, type = 'text', options }) {
  return (
    <div className="py-3.5 grid grid-cols-[160px_1fr] gap-4 items-baseline">
      <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-steel">{label}</dt>
      <dd className="m-0">
        {readOnly ? (
          <span className="font-body text-[15px] text-ink">{value}</span>
        ) : type === 'select' ? (
          <select
            value={value}
            onChange={onChange}
            className="focus-ring w-full bg-transparent border-0 border-b border-dotted border-rail text-[15px] font-body text-ink py-0.5"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '' ? 'Select…' : opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="focus-ring w-full bg-transparent border-0 border-b border-dotted border-rail text-[15px] font-body text-ink placeholder:text-steel/45 py-0.5"
          />
        )}
      </dd>
    </div>
  )
}
