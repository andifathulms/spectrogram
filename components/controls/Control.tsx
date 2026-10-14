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

/**
 * Radio group as a segmented control. Keyboard-operable by construction: the
 * radios are real, visually hidden, and the pill they sit in shows their
 * focus.
 */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  const name = useId()

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-[1.25rem] border border-hairline bg-void p-[3px]"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <label
            key={option.value}
            title={option.title}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-[0.8125rem] font-medium leading-tight transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-instrument ${
              active
                ? 'bg-raised text-ink shadow-[inset_0_0_0_1px_theme(colors.emulsion)]'
                : 'text-inkFaint hover:text-ink'
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
  // How far along the track the thumb is, for the filled part of the track.
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div>
      <input
        type="range"
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
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
        <div className="flex justify-between text-xs text-inkFaint">
          {ticks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * One button system. Primary is light through the plate — energyHigh with
 * plate text — so instrument cyan is left to mean "a measurement" and never
 * "press here". Everything else is a quiet outline. Both are pills.
 */
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
      ? 'border-energyHigh bg-energyHigh text-plate hover:bg-ink hover:border-ink'
      : 'border-hairline text-ink hover:border-inkFaint'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  )
}
