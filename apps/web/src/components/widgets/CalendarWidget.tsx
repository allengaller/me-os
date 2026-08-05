import { Calendar, Clock } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'task' | 'reminder';
}

interface CalendarWidgetProps {
  events: CalendarEvent[];
}

const TYPE_INDICATOR: Record<CalendarEvent['type'], string> = {
  meeting: '#4F46E5',
  task: '#16A34A',
  reminder: '#D97706',
};

export default function CalendarWidget({ events }: CalendarWidgetProps) {
  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <h3
          className="text-base font-medium"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          今日日程
        </h3>
      </div>

      <div className="space-y-3 flex-1">
        {events.length === 0 && (
          <p
            className="text-sm text-center py-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            今日无日程
          </p>
        )}
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-3">
            <div className="flex items-center gap-1 flex-shrink-0 w-14">
              <Clock size={11} style={{ color: 'var(--color-text-tertiary)' }} />
              <span
                className="text-[11px]"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {event.time}
              </span>
            </div>
            <span
              className="w-1 h-1 rounded-full flex-shrink-0 mt-1.5"
              style={{ backgroundColor: TYPE_INDICATOR[event.type] }}
            />
            <span
              className="text-sm flex-1 leading-snug"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {event.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
