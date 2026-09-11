/**
 * Score calculation utilities ported from cmm-mobile/src/screens/User/Model/Xbxh/calculations.js
 */

export function sumPeriods(periodsData: any[]): number {
  if (!periodsData) return 0;
  return periodsData.reduce((sum: number, day: any) =>
    sum + Number(day.Tiet1 || 0) + Number(day.Tiet2 || 0) + Number(day.Tiet3 || 0) + Number(day.Tiet4 || 0) + Number(day.Tiet5 || 0),
    0
  );
}

export function TinhDiem2(
  vpmList: any[] = [],
  classList: any[] = [],
  user: any = null,
  week: string = '',
  sdbList: any[] = []
): { week_id: string; class_id: string; score: number }[] {
  const isKhoiAdmin = user?.role === 'admin_khoi' || user?.role === 'Admin Khối' || user?.role === 'ADMIN_KHOI';
  const KList = isKhoiAdmin && user?.grade_scope
    ? classList.filter(c => String(c.grade) === String(user.grade_scope))
    : (classList ?? []);

  const results: { week_id: string; class_id: string; score: number }[] = [];

  for (const cls of KList) {
    let iniMinus = 0;
    const sdbRecord = sdbList?.find((s: any) => s.class_id === cls.class_id);
    const cnt = sdbRecord?.quantity ?? 0;
    const result = sdbRecord ? sumPeriods(sdbRecord.periods_data) : 0;

    for (const obj of (vpmList ?? [])) {
      if (obj.class_id !== cls.class_id) continue;
      if (obj.bonus == null) {
        const minusPnt = obj.name_vp_id?.minus_pnt ?? 0;
        iniMinus += minusPnt * obj.quantity;
      } else if (obj.bonus !== 'Điểm sổ đầu bài') {
        // other bonus types (Điểm cộng/trừ ĐT)
        iniMinus += obj.quantity;
      }
    }

    results.push({
      week_id: week,
      class_id: cls.class_id,
      score: iniMinus * 0.2 + (result / (cnt || 1)) * 10 * 0.8,
    });
  }

  return results;
}

export function calculateRankingNotes(
  classList: any[] = [],
  data3: any[] = [],
  user: any = null,
  weekin4: any = null
): { note: string; class_id: string; week_id: string }[] {
  if (!classList || !data3) return [];

  const isKhoiAdmin = user?.role === 'admin_khoi' || user?.role === 'Admin Khối' || user?.role === 'ADMIN_KHOI';
  const classes = isKhoiAdmin && user?.grade_scope
    ? classList.filter((c: any) => String(c.grade) === String(user.grade_scope))
    : classList;

  const noteList: { note: string; class_id: string; week_id: string }[] = [];
  const weekId = typeof weekin4 === 'string' ? weekin4 : (weekin4?.week_id ?? '');

  for (const cls of classes) {
    const classId = cls.class_id;
    const tmpVpmRule = data3.filter((item2: any) => item2.class_id === classId);

    const item: {
      supernote: Record<string, { num: number; lst: string }>;
      note: string;
      PlusĐT: number;
      MinusĐT: number;
      MinusPnt: number;
    } = { supernote: {}, note: '', PlusĐT: 0, MinusĐT: 0, MinusPnt: 0 };

    tmpVpmRule.forEach((obj: any) => {
      if (obj.bonus == null) {
        const minusPnt = obj.name_vp_id?.minus_pnt ?? 0;
        item.MinusPnt += minusPnt * obj.quantity;
        const vpName = obj.name_vp_id?.name_vp || 'Vi phạm';

        if (item.supernote[vpName]) {
          item.supernote[vpName].num += obj.quantity;
          item.supernote[vpName].lst += obj.students?.length
            ? ', ' + obj.students.map((s: any) => s.student_name).join(', ')
            : '';
        } else {
          item.supernote[vpName] = {
            num: obj.quantity,
            lst: obj.students?.length
              ? obj.students.map((s: any) => s.student_name).join(', ')
              : '',
          };
        }
      } else if (obj.bonus !== 'Điểm sổ đầu bài') {
        item.supernote[obj.bonus] = { num: 0, lst: '' };
        if (obj.quantity < 0) {
          item.MinusĐT += obj.quantity;
        } else {
          item.PlusĐT += obj.quantity;
        }
      }
    });

    const entries = Object.entries(item.supernote);
    entries.forEach((itm, idx) => {
      item.note += `${idx + 1}. ${itm[0]}: ${itm[1].num ? itm[1].num : ''} ${itm[1].lst ? '(' + itm[1].lst + ')' : ''}\n`;
    });

    noteList.push({ note: item.note, class_id: classId, week_id: weekId });
  }

  return noteList;
}

export const FontStyle = (char: any) => ({
  t: 's',
  v: String(char ?? ''),
  s: {
    font: { name: "Times New Roman", sz: 13, bold: true, color: { rgb: "000000" } },
    alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: 'black' },
      bottom: { style: 'thin', color: 'black' },
      left: { style: 'thin', color: 'black' },
      right: { style: 'thin', color: 'black' }
    }
  }
});

export const FontStyleNote = (char: any) => ({
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

export function calculateExcelData(
  data2: any[] = [],
  data3: any[] = [],
  user: any = null,
  sdbList: any[] = []
): any[] {
  let specialTemp: any[] = [];
  const temp10: any[] = [];
  const temp11: any[] = [];
  const temp12: any[] = [];

  if (data2 != null && data3 != null) {
    const groupedByGrade = data2.reduce((groups: any, item: any) => {
      const { week_id, class_id, ...rest } = item;
      const classIdStr = typeof class_id === 'object' ? class_id.class_id : class_id;

      let grade = typeof class_id === 'object' && class_id.grade ? String(class_id.grade) : '';
      if (!grade && classIdStr) {
        const match = classIdStr.match(/\d+/);
        if (match) grade = match[0].slice(0, 2);
      }

      if (!groups[grade]) {
        groups[grade] = [];
      }

      groups[grade].push({ ...rest, class_id: classIdStr });
      return groups;
    }, {});

    for (const gradeTmp in groupedByGrade) {
      const classes = groupedByGrade[gradeTmp];
      classes.sort((a: any, b: any) => b.score - a.score);

      let rank = 0;
      for (const classObj of classes) {
        rank++;

        if (gradeTmp === "10") {
          temp10.push({ class: classObj.class_id, score: classObj.score, rank });
        } else if (gradeTmp === "11") {
          temp11.push({ class: classObj.class_id, score: classObj.score, rank });
        } else {
          temp12.push({ class: classObj.class_id, score: classObj.score, rank });
        }
      }
    }

    function findClass() {
      if (user?.role !== 'sao_do' && user?.role !== 'Sao Đỏ' && user?.role !== 'SAO_DO') return [];
      let response = [temp10.find(item => item.class === user.user_class)];
      if (response[0] !== undefined) return response;
      response = [temp11.find(item => item.class === user.user_class)];
      if (response[0] !== undefined) return response;
      response = [temp12.find(item => item.class === user.user_class)];
      if (response[0] !== undefined) return response;
      return [];
    }

    function workingWithTemp(temp: any[]) {
      return temp.map(item => {
        const tmpVpmRule = data3.filter((item2: any) => item2.class_id === item.class);
        item.PlusĐT = 0;
        item.MinusĐT = 0;
        item.MinusPnt = 0;
        item.supernote = {};

        const sdbRecord = sdbList?.find((s: any) => s.class_id === item.class);
        item.SoTiet = sdbRecord?.quantity ?? 0;
        item.SĐB = sdbRecord ? sumPeriods(sdbRecord.periods_data) : 0;

        tmpVpmRule.forEach((obj: any) => {
          if (obj.bonus == null) {
            const minusPnt = obj.name_vp_id?.minus_pnt ?? 0;
            item.MinusPnt += minusPnt * obj.quantity;
            const vpName = obj.name_vp_id?.name_vp || 'Vi phạm';

            if (item.supernote[vpName]) {
              item.supernote[vpName].num += obj.quantity;
              item.supernote[vpName].lst += obj.students?.length
                ? ', ' + obj.students.map((s: any) => s.student_name).join(', ')
                : '';
            } else {
              item.supernote[vpName] = {
                num: obj.quantity,
                lst: obj.students?.length
                  ? obj.students.map((s: any) => s.student_name).join(', ')
                  : '',
              };
            }
          } else {
            item.supernote[obj.bonus] = { num: 0, lst: '' };
            if (obj.quantity < 0) {
              item.MinusĐT += obj.quantity;
            } else {
              item.PlusĐT += obj.quantity;
            }
          }
        });

        item.note = '';
        let sEntries: [string, any][] = [];
        if (item.supernote) {
          sEntries = Object.entries(item.supernote);
          sEntries.forEach((itm: any, idx: number) => {
            item.note += `${idx + 1}. ${itm[0]}: ${itm[1].num ? itm[1].num : ''} ${itm[1].lst ? '(' + itm[1].lst + ')' : ''}\n`;
          });
        }

        const classNameDisplay = item.class.startsWith('Lớp ') ? item.class.slice(4) : (item.class.startsWith('lop') ? item.class.slice(3) : item.class);
        const noteClean = item.note ? item.note.slice(0, item.note.length - 1) : '';

        return [
          FontStyle(classNameDisplay),
          FontStyle(item.SĐB),
          FontStyle(item.SoTiet),
          FontStyle(item.MinusPnt + item.MinusĐT),
          FontStyle(item.PlusĐT),
          FontStyle(item.score),
          FontStyle(item.rank),
          FontStyleNote(noteClean),
          item.supernote ? sEntries.length : 1,
        ];
      });
    }

    specialTemp = findClass();
    if (specialTemp.length !== 0) {
      return [workingWithTemp(specialTemp)];
    } else {
      return [workingWithTemp(temp10), workingWithTemp(temp11), workingWithTemp(temp12)];
    }
  }
  return [];
}
