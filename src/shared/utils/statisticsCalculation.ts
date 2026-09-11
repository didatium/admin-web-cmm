/**
 * Statistics calculation utilities ported from cmm-mobile/src/screens/User/Model/Tkdl/
 */

export const FontStyleTk = (char: any, fillColor: string = "FFFFFF") => ({
  t: 's',
  v: String(char ?? ''),
  s: {
    font: { name: "Times New Roman", sz: 13, bold: true, color: { rgb: "000000" } },
    alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
    fill: { fgColor: { rgb: fillColor } },
    border: {
      top: { style: 'thin', color: 'black' },
      bottom: { style: 'thin', color: 'black' },
      left: { style: 'thin', color: 'black' },
      right: { style: 'thin', color: 'black' }
    }
  }
});

export const FontStyleNoteTk = (char: any) => ({
  t: 's',
  v: String(char ?? ''),
  s: {
    font: { name: "Times New Roman", sz: 13, color: { rgb: "000000" } },
    alignment: { wrapText: true, vertical: 'center' },
    border: {
      top: { style: 'thin', color: 'black' },
      bottom: { style: 'thin', color: 'black' },
      left: { style: 'thin', color: 'black' },
      right: { style: 'thin', color: 'black' }
    }
  }
});

export type ScoreStatItem = {
  class_id: string;
  class_name: string;
  grade: number;
  totalScore: number;
  rank: number;
  weeklyScores: Record<number, number>;
};

export type ViphamStatItem = {
  week_id: string;
  week_number: number;
  note: string;
  score: number;
};

export function processScoreStatistics(
  scoreList: any[] = [],
  startNumber: number,
  endNumber: number,
  classList: any[] = []
): {
  dataByGrade: Record<number, ScoreStatItem[]>;
  excelFormattedData: any[][][];
} {
  const classMap: Record<string, { class_id: string; totalScore: number; weeklyScores: Record<number, number> }> = {};

  scoreList.forEach((item: any) => {
    const { class_id, week_id, score } = item;
    const weekNum = typeof week_id === 'string' ? parseInt(week_id.replace(/\D/g, ''), 10) : Number(week_id);

    if (weekNum >= startNumber && weekNum <= endNumber) {
      if (!classMap[class_id]) {
        classMap[class_id] = { class_id, totalScore: 0, weeklyScores: {} };
      }
      classMap[class_id].weeklyScores[weekNum] = score != null ? Number(score) : 0;
      classMap[class_id].totalScore += score != null ? Number(score) : 0;
    }
  });

  for (const cid in classMap) {
    classMap[cid].totalScore = Number(classMap[cid].totalScore.toFixed(2));
  }

  const classArray = Object.values(classMap);
  const groups: Record<number, ScoreStatItem[]> = { 10: [], 11: [], 12: [] };

  classArray.forEach((item) => {
    // Extract grade
    let grade = 10;
    const matchedClassObj = classList.find((c: any) => c.class_id === item.class_id);
    if (matchedClassObj && matchedClassObj.grade) {
      grade = matchedClassObj.grade;
    } else {
      const match = item.class_id.match(/\d+/);
      if (match) grade = parseInt(match[0].slice(0, 2), 10);
    }
    if (!groups[grade]) groups[grade] = [];

    const className = matchedClassObj?.class_name || (item.class_id.startsWith('Lớp ') ? item.class_id : 'Lớp ' + item.class_id.slice(3));

    groups[grade].push({
      class_id: item.class_id,
      class_name: className,
      grade,
      totalScore: item.totalScore,
      rank: 0,
      weeklyScores: item.weeklyScores,
    });
  });

  // Calculate rank per grade sorted by totalScore descending
  for (const g in groups) {
    const classes = groups[Number(g)];
    classes.sort((a, b) => b.totalScore - a.totalScore);
    classes.forEach((classItem, index) => {
      classItem.rank = index + 1;
    });
  }

  // Sort within grade by class_id / class_name
  for (const g in groups) {
    groups[Number(g)].sort((a, b) => a.class_id.localeCompare(b.class_id));
  }

  // Format excel styled cell rows
  const excelFormattedData: any[][][] = [];
  [10, 11, 12].forEach((g) => {
    const gradeClasses = groups[g] || [];
    const gradeExcelRows = gradeClasses.map((oneclass) => {
      const displayClassStr = oneclass.class_id.startsWith('Lớp ') ? oneclass.class_id.slice(4) : (oneclass.class_id.startsWith('cls') ? oneclass.class_id.slice(3) : oneclass.class_id);
      const temp = [FontStyleTk(displayClassStr, "fbfb9b")];
      for (let w = startNumber; w <= endNumber; w++) {
        const sVal = oneclass.weeklyScores[w] != null ? oneclass.weeklyScores[w] : 0;
        temp.push(FontStyleTk(sVal, "FFFFFF"));
      }
      temp.push(FontStyleTk(oneclass.totalScore, "f6f409"));
      temp.push(FontStyleTk(oneclass.rank, "f6f409"));
      return temp;
    });
    excelFormattedData.push(gradeExcelRows);
  });

  return {
    dataByGrade: groups,
    excelFormattedData,
  };
}

export function processViphamStatistics(
  scoreList: any[] = [],
  selectClassId: string,
  startNumber: number,
  endNumber: number
): {
  statItems: ViphamStatItem[];
  excelFormattedData: any[][];
} {
  const oneclass: ViphamStatItem[] = [];

  scoreList.forEach((item: any) => {
    const { class_id, week_id, score, note } = item;
    const weekNum = typeof week_id === 'string' ? parseInt(week_id.replace(/\D/g, ''), 10) : Number(week_id);

    if (weekNum >= startNumber && weekNum <= endNumber && class_id === selectClassId) {
      oneclass.push({
        week_id,
        week_number: weekNum,
        note: note || '',
        score: score != null ? Number(score.toFixed(2)) : 0,
      });
    }
  });

  oneclass.sort((a, b) => a.week_number - b.week_number);

  const excelRows = oneclass.map((oneweek) => [
    FontStyleTk(oneweek.week_number, "ffffff"),
    FontStyleNoteTk(oneweek.note),
    FontStyleTk(oneweek.score, "ffffff"),
  ]);

  return {
    statItems: oneclass,
    excelFormattedData: excelRows,
  };
}
