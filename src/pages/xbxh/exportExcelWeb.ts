import XLSX from 'xlsx-js-style';
import { calculateExcelData, FormatDate } from 'cmm-shared';

export function minus1days(item: any) {
  if (!item) return new Date().toDateString();
  return new Date(new Date(item).getTime() - 24 * 60 * 60 * 1000).toDateString();
}

export const FontStyle = (char: any) => ({
  t: 's',
  v: char,
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
  v: char,
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

export function writeWorkbook(
  data: any[],
  weekin4: any,
  _classList?: any[],
  _user?: any
) {
  if (!data || !data.length) return;

  const data10 = data[0] || [];
  const data11 = data[1] || [];
  const data12 = data[2] || [];
  const flatData = [...data10, ...data11, ...data12];

  const weekName = weekin4?.week_name || 'Tuần';
  const startDate = weekin4?.start_date ? FormatDate(minus1days(weekin4.start_date)) : '';
  const endDate = weekin4?.end_date ? FormatDate(minus1days(weekin4.end_date)) : '';

  const MainRow = [
    {
      v: 'KẾT QUẢ THI ĐUA ' + weekName,
      t: "s",
      s: {
        font: { name: "Times New Roman", sz: 20, bold: true, color: { rgb: "FF0000" } },
        alignment: { wrapText: true, vertical: 'center', horizontal: 'center' }
      }
    },
    {
      v: weekName + ' (từ ' + startDate + ' đến ' + endDate + ')',
      t: "s",
      s: {
        font: { name: "Times New Roman", sz: 13, bold: true, color: { rgb: "0070c0" } },
        alignment: { wrapText: true, vertical: 'center', horizontal: 'center' }
      }
    }
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([[MainRow[0]], [MainRow[1]]]);
  const workbook = XLSX.utils.book_new();

  const header = ["LỚP", `ĐIỂM\nSĐB`, 'SỐ TIẾT', `ĐIỂM\nTRỪ`, 'ĐIỂM\nCỘNG', "TỔNG ĐIỂM", "XẾP HẠNG", "GHI CHÚ"];
  const headerRow1 = header.map(headers => ({
    t: 's',
    v: headers,
    s: {
      font: { name: "Times New Roman", sz: 13, bold: true, color: { rgb: "FF0000" } },
      alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
      fill: { fgColor: { rgb: "ffff00" } },
      border: {
        top: { style: 'thin', color: 'black' },
        bottom: { style: 'thin', color: 'black' },
        left: { style: 'thin', color: 'black' },
        right: { style: 'thin', color: 'black' }
      }
    }
  }));

  const k10 = data10.length;
  const k11 = data11.length;
  const k12 = data12.length;

  XLSX.utils.sheet_add_aoa(worksheet, [headerRow1], { origin: "A3" });
  if (data10.length) XLSX.utils.sheet_add_aoa(worksheet, data10, { origin: "A4" });

  const r11_header = 3 + k10 + 1;
  const r11_data = 4 + k10 + 1;
  XLSX.utils.sheet_add_aoa(worksheet, [headerRow1], { origin: "A" + r11_header });
  if (data11.length) XLSX.utils.sheet_add_aoa(worksheet, data11, { origin: "A" + r11_data });

  const r12_header = 3 + k10 + 1 + k11 + 1;
  const r12_data = 4 + k10 + 1 + k11 + 1;
  XLSX.utils.sheet_add_aoa(worksheet, [headerRow1], { origin: "A" + r12_header });
  if (data12.length) XLSX.utils.sheet_add_aoa(worksheet, data12, { origin: "A" + r12_data });

  const cols: { wch?: number; wpx?: number }[] = [];
  header.forEach((_, idx) => {
    cols.push({ wch: header[idx].length * 1.8 });
  });
  cols[0].wch = header[0].length * 3;
  cols[7].wpx = 750;
  worksheet["!cols"] = cols;

  const rows: { hpx?: number }[] = [];
  rows[0] = { hpx: 30 };
  rows[2] = { hpx: 40 };

  const merge = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ];

  let i = 3;
  for (let j = 3; j <= 3 + k11 + k10 + k12 - 1 + 2; j++) {
    if (j === (3 + k10) || j === (3 + k10 + k11 + 1)) {
      rows[j] = { hpx: 40 };
    } else {
      const lineMultiplier = flatData[i - 3] ? flatData[i - 3][8] : 1;
      rows[j] = { hpx: 20 * lineMultiplier };
      i++;
    }
  }

  worksheet["!rows"] = rows;
  worksheet["!merges"] = merge;

  XLSX.utils.book_append_sheet(workbook, worksheet, weekName);
  XLSX.writeFile(workbook, `Kết quả thi đua ${weekName}.xlsx`);
}

export function exportXbxhToExcel(
  scoreList: any[],
  vpmList: any[],
  ruleList: any[],
  sdbList: any[],
  classList: any[],
  user: any,
  weekObj: any,
) {
  let data2: any[] | null = null;
  let data3: any[] | null = null;

  if (scoreList != null && classList != null) {
    const dataTemp = JSON.parse(JSON.stringify(scoreList));
    dataTemp.forEach((item: any) => {
      const scoreClass = classList.find((item2: any) => item2.class_id === item.class_id);
      item.class_id = scoreClass || { class_id: item.class_id, class_name: item.class_id };
    });
    data2 = dataTemp;
  }

  if (ruleList != null && vpmList != null) {
    const dataTemp3 = JSON.parse(JSON.stringify(vpmList));
    dataTemp3.forEach((item: any) => {
      if (item.bonus == null) {
        const vpmRule = ruleList.find((item2: any) => item2.name_vp_id === item.name_vp_id);
        item.name_vp_id = vpmRule || item.name_vp_id;
      }
    });
    data3 = dataTemp3;
  }

  const excelData = calculateExcelData(data2 || [], data3 || [], user, sdbList || []);
  writeWorkbook(excelData, weekObj, classList, user);
}
