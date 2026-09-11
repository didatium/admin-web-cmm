const STORAGE_KEY = 'cmm-score-staleness';

type StaleMap = Record<string, true>;

function key(classId: string, weekId: string) {
  return `${classId}::${weekId}`;
}

function read(): StaleMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as StaleMap;
  } catch {
    return {};
  }
}

function write(value: StaleMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

/** Marks a persisted score as out of date after its Stvp/SDB source changes. */
export function markScoreStale(classId: string, weekId: string) {
  const stale = read();
  stale[key(classId, weekId)] = true;
  write(stale);
}

/** Clears the marker after a successful explicit score calculation. */
export function clearScoreStale(classIds: string[], weekId: string) {
  const stale = read();
  classIds.forEach((classId) => delete stale[key(classId, weekId)]);
  write(stale);
}

export function isScoreStale(classId: string, weekId: string) {
  return read()[key(classId, weekId)] === true;
}
