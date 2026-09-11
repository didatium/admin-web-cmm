/**
 * Returns the week that contains the local calendar day.  Dates are compared
 * inclusively so a week remains current for its full end date.
 */
export function getCurrentWeekId(weeks: any[], fallbackToFirst = false): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = (weeks ?? []).find((week: any) => {
    const start = new Date(week.start_date);
    const end = new Date(week.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  });

  return current ? String(current.week_id) : (fallbackToFirst && weeks?.[0] ? String(weeks[0].week_id) : '');
}
