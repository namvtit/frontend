import React from 'react';
import { ECONOMIC_CALENDAR } from '@/lib/market/mock-data';
import { CalendarDays, Filter } from 'lucide-react';

const ImpactIcon = ({ impact }: { impact: 'high' | 'medium' | 'low' }) => {
  const colorClass =
    impact === 'high'
      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
      : impact === 'medium'
      ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
      : 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]';

  return (
    <div
      className={`h-3 w-3 rounded-sm ${colorClass}`}
      title={`${impact.charAt(0).toUpperCase() + impact.slice(1)} Impact`}
    />
  );
};

export const EconomicCalendar = () => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Economic Calendar</h2>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/10 sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cur.
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Imp.
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actual
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Forecast
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Previous
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card text-sm">
              {ECONOMIC_CALENDAR.map((event) => (
                <tr key={event.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-medium">
                    {event.time}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-foreground">
                    <span className="px-2 py-1 rounded bg-muted/50 text-xs">
                      {event.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-start">
                      <ImpactIcon impact={event.impact} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground group-hover:text-primary transition-colors">
                    {event.event}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-right font-medium
                    ${
                      event.actual && event.forecast && event.actual > event.forecast
                        ? 'text-emerald-500'
                        : event.actual && event.forecast && event.actual < event.forecast
                        ? 'text-red-500'
                        : 'text-foreground'
                    }`}
                  >
                    {event.actual || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-muted-foreground hidden sm:table-cell">
                    {event.forecast || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-muted-foreground hidden sm:table-cell">
                    {event.previous || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-border bg-muted/10 p-3 text-center">
        <a href="#" className="text-xs font-medium text-primary hover:underline">
          View Full Calendar →
        </a>
      </div>
    </div>
  );
};
