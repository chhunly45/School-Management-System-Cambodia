import { ReactNode } from 'react';

interface AttendanceActionCardProps {
  title: string;
  description: string;
  disabled?: boolean;
  busy?: boolean;
  actionLabel: string;
  onAction: () => void;
  children?: ReactNode;
}

const AttendanceActionCard = ({
  title,
  description,
  disabled = false,
  busy = false,
  actionLabel,
  onAction,
  children
}: AttendanceActionCardProps) => {
  return (
    <article className="rounded-[2rem] bg-white p-6 shadow ring-1 ring-border">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>

        {children}

        <button
          type="button"
          onClick={onAction}
          disabled={disabled || busy}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          aria-disabled={disabled || busy}
        >
          {busy ? 'Processing...' : actionLabel}
        </button>
      </div>
    </article>
  );
};

export default AttendanceActionCard;
