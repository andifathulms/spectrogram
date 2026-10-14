'use client'

import { cloneElement, isValidElement, useId, type ReactElement } from 'react'

import { Quantity } from '@/components/ui/Quantity'

interface FieldProps {
  label: string
  help?: string
  /** Formatted current value, shown beside the label. */
  value?: string
  children: React.ReactNode
}

/**
 * A label, a value, a control, and its help text. When the control is a
 * single `Slider`, the label becomes a real `<label htmlFor>` for it and the
 * help text becomes its `aria-describedby` — so the visible label a sighted
 * user already reads is the one a screen reader associates with the input,
 * not a second, separately-typed `aria-label`.
 */
export function Field({ label, help, value, children }: FieldProps) {
  const controlId = useId()
  const helpId = useId()
  const isSlider = isValidElement(children) && children.type === Slider

  const control = isSlider
    ? cloneElement(children as ReactElement<SliderProps>, {
        id: controlId,
        ...(help !== undefined ? { 'aria-describedby': helpId } : {}),
      })
    : children

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        {isSlider ? (
          <label htmlFor={controlId} className="control-label">
            {label}
          </label>
        ) : (
          <span className="control-label">{label}</span>
        )}
        {value !== undefined && <Quantity value={value} className="text-sm text-instrument" />}
      </div>
      <div className="mt-1.5">{control}</div>
      {help !== undefined && (
        <p id={helpId} className="mt-1.5 text-xs leading-snug text-inkFaint">
          {help}
        </p>
      )}
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
  /** Set by `Field` when this slider is its single child — not passed by callers. */
  id?: string
  'aria-describedby'?: string
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  ariaLabel,
  ticks,
  id,
  'aria-describedby': ariaDescribedBy,
}: SliderProps) {
  return (
    <div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
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
