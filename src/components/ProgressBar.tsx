interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const safeCurrent = Math.min(Math.max(current, 0), total);
  const value = total === 0 ? 0 : Math.round((safeCurrent / total) * 100);

  return (
    <div className="progress-wrapper">
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Postęp quizu"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={safeCurrent}
        aria-valuetext={`${safeCurrent} z ${total}`}
      >
        <div className="progress-value" style={{ width: `${value}%` }} />
      </div>
      <span aria-hidden="true">{safeCurrent}/{total}</span>
    </div>
  );
}
