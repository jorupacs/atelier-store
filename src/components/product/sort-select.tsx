type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Labelled sort dropdown for product listings. */
export function SortSelect<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <label className="flex items-center gap-2 text-body-sm">
      <span className="text-muted">Sort</span>
      <select
        value={value}
        onChange={(e) => {
          const option = options.find((o) => o.value === e.target.value);
          if (option) onChange(option.value);
        }}
        className="h-11 cursor-pointer border border-line bg-paper px-3 text-body-sm hover:border-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
