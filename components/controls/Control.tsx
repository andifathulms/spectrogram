'use client'

import { useId } from 'react'

interface FieldProps {
  label: string
  help?: string
  /** Formatted current value, shown beside the label. */
  value?: string
  children: React.ReactNode
}

export function Field({ label, help, value, children }: FieldProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="control-label">{label}</span>
        {value !== undefined && <span className="tabular text-sm text-instrument">{value}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {help !== undefined && <p className="mt-1.5 text-xs leading-snug text-inkFaint">{help}</p>}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string; title?: string }[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** Radio group as a segmented control. Keyboard-operable by construction. */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  const name = useId()

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <label
            key={option.value}
            title={option.title}
            className={`cursor-pointer border px-2.5 py-1 text-xs ${
              active
                ? 'border-instrument text-instrument'
                : 'border-emulsion text-inkMuted hover:text-energyHigh'
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={active}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}

interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  ariaLabel: string
  /** Rendered under the track, e.g. the discrete window sizes. */
  ticks?: readonly string[]
}

export function Slider({ min, max, step = 1, value, onChange, ariaLabel, ticks }: SliderProps) {
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {ticks !== undefined && (
        <div className="tabular flex justify-between text-[10px] text-inkFaint">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'primary'
  disabled?: boolean
}) {
  const styles =
    variant === 'primary'
      ? 'border-instrument text-instrument hover:bg-instrument hover:text-plate'
      : 'border-emulsion text-inkMuted hover:border-instrument hover:text-instrument'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border px-3.5 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  )
}
