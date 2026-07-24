interface Props {
  value: number; // 0–1
  onChange: (a: number) => void;
}

/**
 * Transparency coefficient α. 0 = fully transparent (figure vanishes),
 * 1 = fully opaque (figure hides the backgrounds).
 */
export default function AlphaSlider({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold text-ink">
          Transparency <span className="font-mono text-muted">α</span>
        </label>
        <span className="font-mono text-sm text-ink">{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted">
        <span>transparent</span>
        <span>opaque</span>
      </div>
    </div>
  );
}
