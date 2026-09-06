import XLSX from 'xlsx-js-style';
import {
  FormatDate,
  processScoreStatistics,
  processViphamStatistics,
} from 'cmm-shared';

export function exportScoreReportExcel(
  scoreList: any[],
  startWeekObj: any,
  endWeekObj: any,
  classList: any[]
) {
  if (!startWeekObj || !endWeekObj) return;

  const startId = String(startWeekObj.week_id);
  const endId = String(endWeekObj.week_id);

  const startNumber = parseInt(startId.replace(/\D/g, ''), 10);
  const endNumber = parseInt(endId.replace(/\D/g, ''), 10);

  const { excelFormattedData } = processScoreStatistics(scoreList, startNumber, endNumber, classList);

  const thongKeDiem = excelFormattedData; // [grade10Rows, grade11Rows, grade12Rows]

  const MainRow = [
    {
      v: FormatDate(new Date()),
      t: 's',
      s: {
        font: { name: 'Times New Roman', sz: 14, italic: true, color: { rgb: '000000' } },
        alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
      },
    },
    {
      v: `TỔNG KẾT THI ĐUA TỪ TUẦN ${startNumber} ĐẾN TUẦN ${endNumber}`,
      t: 's',
      s: {
        font: { name: 'Times New Roman', sz: 16, bold: true, color: { rgb: '000000' } },
        alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
      },
    },
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([[MainRow[0]], [MainRow[1]]]);
  const workbook = XLSX.utils.book_new();

  const header = ['LỚP'];
  for (let i = startNumber; i <= endNumber; i++) {
    header.push('T' + i);
  }
  header.push('TỔNG');
  header.push('XẾP HẠNG');

  const headerRow1 = header.map((h) => ({
    t: 's',
    v: h,
    s: {
      font: { name: 'Times New Roman', sz: 13, bold: true, color: { rgb: '000000' } },
      alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
      fill: { fgColor: { rgb: 'cbfbcb' } },
      border: {
        top: { style: 'thin', color: 'black' },
        bottom: { style: 'thin', color: 'black' },
        left: { style: 'thin', color: 'black' },
        right: { style: 'thin', color: 'black' },
      },
    },
  }));

  const g10 = thongKeDiem[0] || [];
  const g11 = thongKeDiem[1] || [];
  const g12 = thongKeDiem[2] || [];

  XLSX.utils.sheet_add_aoa(worksheet, [headerRow1], { origin: 'A4' });
  if (g10.length) XLSX.utils.sheet_add_aoa(worksheet, g10, { origin: 'A5' });

  const r11_header = 4 + g10.length + 1;
  const r11_data = 4 + g10.length + 2;
  XLSX.utils.sheet_add_aoa(worksheet, [headerRow1], { origin: 'A' + r11_header });
  if (g11.length) XLSX.utils.sheet_add_aoa(worksheet, g11, { origin: 'A' + r11_data });

  const r12_header = 4 + g10.length + g11.length + 2;
  const r12_data = 4 + g10.length + g11.length + 3;
  XLSX.utils.sheet_add_aoa(worksheet, [headerRow1], { origin: 'A' + r12_header });
  if (g12.length) XLSX.utils.sheet_add_aoa(worksheet, g12, { origin: 'A' + r12_data });

  const cols: { wch?: number }[] = [];
  header.forEach(() => {
    cols.push({ wch: 8 });
  });
  cols[0].wch = 8;
  const totalColIdx = endNumber - startNumber + 1;
  if (cols[totalColIdx]) cols[totalColIdx].wch = 10;
  if (cols[totalColIdx + 1]) cols[totalColIdx + 1].wch = 15;

  worksheet['!cols'] = cols;

  const merge = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: endNumber - startNumber + 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: endNumber - startNumber + 3 } },
  ];
  worksheet['!merges'] = merge;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'KẾT QUẢ');
  XLSX.writeFile(
    workbook,
    `TỔNG KẾT THI ĐUA TỪ TUẦN ${startNumber} ĐẾN TUẦN ${endNumber}.xlsx`
  );
}

export function exportViphamReportExcel(
  scoreList: any[],
  startWeekObj: any,
  endWeekObj: any,
  selectClassObj: any
) {
  if (!startWeekObj || !endWeekObj || !selectClassObj) return;

  const startId = String(startWeekObj.week_id);
  const endId = String(endWeekObj.week_id);

  const startNumber = parseInt(startId.replace(/\D/g, ''), 10);
  const endNumber = parseInt(endId.replace(/\D/g, ''), 10);

  const selectClassId = String(selectClassObj.class_id);
  const classNameDisplay = selectClassObj.class_name || (selectClassId.startsWith('Lớp ') ? selectClassId.slice(4) : selectClassId.slice(3));

  const { statItems, excelFormattedData } = processViphamStatistics(
    scoreList,
    selectClassId,
    startNumber,
    endNumber
  );

  const MainRow = [
    {
      v: FormatDate(new Date()),
      t: 's',
      s: {
        font: { name: 'Times New Roman', sz: 14, italic: true, color: { rgb: '000000' } },
        alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
      },
    },
    {
      v: `TỔNG KẾT THI ĐUA LỚP ${classNameDisplay}\nTỪ TUẦN ${startNumber} ĐẾN TUẦN ${endNumber}`,
      t: 's',
      s: {
        font: { name: 'Times New Roman', sz: 16, bold: true, color: { rgb: '000000' } },
        alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
      },
    },
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([[MainRow[0]], [MainRow[1]]]);
  const workbook = XLSX.utils.book_new();

  const header = ['TUẦN', 'VI PHẠM', 'ĐIỂM'];
  const headerRow1 = header.map((h) => ({
    t: 's',
    v: h,
    s: {
      font: { name: 'Times New Roman', sz: 13, bold: true, color: { rgb: '000000' } },
      alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
      fill: { fgColor: { rgb: 'cbfbcb' } },
      border: {
        top: { style: 'thin', color: 'black' },
        bottom: { style: 'thin', color: 'black' },
        left: { style: 'thin', color: 'black' },
        right: { style: 'thin', color: 'black' },
      },
    },
  }));

  XLSX.utils.sheet_add_aoa(worksheet, [headerRow1], { origin: 'A4' });
  if (excelFormattedData.length) {
    XLSX.utils.sheet_add_aoa(worksheet, excelFormattedData, { origin: 'A5' });
  }

  worksheet['!cols'] = [{ wch: 10 }, { wpx: 750 }, { wch: 10 }];

  // Dynamic row heights calculation for multiline violation entries
  const rows: { hpx?: number }[] = [];
  rows[0] = { hpx: 30 }; // Title 1 height
  rows[1] = { hpx: 40 }; // Title 2 height
  rows[3] = { hpx: 30 }; // Header row height

  statItems.forEach((item, idx) => {
    const noteText = item.note || '';
    const lineCount = noteText ? noteText.trim().split('\n').length : 1;
    // 22px per line of text to ensure all multiline violation notes are fully visible
    const rowHpx = Math.max(30, lineCount * 22);
    rows[4 + idx] = { hpx: rowHpx };
  });

  worksheet['!rows'] = rows;

  const merge = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
  ];
  worksheet['!merges'] = merge;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'KẾT QUẢ');
  XLSX.writeFile(
    workbook,
    `TỔNG KẾT THI ĐUA LỚP ${classNameDisplay} TỪ TUẦN ${startNumber} ĐẾN TUẦN ${endNumber}.xlsx`
  );
}
