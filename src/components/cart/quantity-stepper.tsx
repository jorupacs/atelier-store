type Props = {
  /** What the quantity is of, for screen readers. */
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
};

/** Minus, number, plus. The limits use aria-disabled so that focus isn't lost. */
export function QuantityStepper({ label, value, max, onChange }: Props) {
  const canDecrease = value > 1;
  const canIncrease = value < max;

  return (
    <div role="group" aria-label={`Quantity of ${label}`} className="hairline flex items-center">
      <button
        type="button"
        aria-label="Decrease quantity"
        aria-disabled={!canDecrease}
        // From above what's in stock, step straight down to it.
        onClick={() => canDecrease && onChange(Math.min(value - 1, max))}
        className={STEP}
      >
        −
      </button>
      <span className="min-w-8 text-center text-body-sm tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        aria-disabled={!canIncrease}
        onClick={() => canIncrease && onChange(value + 1)}
        className={STEP}
      >
        +
      </button>
    </div>
  );
}

const STEP =
  "size-11 cursor-pointer text-body-lg transition-colors duration-[var(--duration-fast)] hover:bg-canvas aria-disabled:cursor-not-allowed aria-disabled:bg-transparent aria-disabled:text-subtle";
