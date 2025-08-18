"use client"

interface FluidToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function FluidToggle({ checked, onChange, label }: FluidToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
          checked ? "bg-blue-500" : "bg-white/20"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </div>
      {label && <span className="text-white">{label}</span>}
    </label>
  )
}
