import XLSX from 'xlsx-js-style';
import { FormatDate, getCleanDate } from 'cmm-shared';

export function exportStudentViphamExcel(
  student: any,
  targetClass: any,
  studentViolations: any[]
) {
  if (!studentViolations || studentViolations.length === 0) return;

  const studentName = (student.student_name || '').toUpperCase();
  const className = targetClass?.class_name || student.class_id || 'N/A';
  const gender = student.gioi_tinh || 'N/A';
  const birthStr = student.ngay_sinh
    ? new Date(student.ngay_sinh).toLocaleDateString('vi-VN')
    : 'N/A';

  // 1. Dựng mảng dữ liệu AOA
  const aoaData: any[][] = [
    [`BÁO CÁO LỊCH SỬ VI PHẠM - ${studentName}`],
    [],
    ['THÔNG TIN HỌC SINH'],
    ['Họ và tên:', student.student_name],
    ['Lớp:', className],
    ['Giới tính:', gender],
    ['Ngày sinh:', birthStr],
    ['Tổng số vi phạm:', studentViolations.length],
    [],
    ['DANH SÁCH VI PHẠM CHI TIẾT'],
    ['STT', 'Tuần', 'Ngày vi phạm', 'Nội dung vi phạm'],
    ...studentViolations.map((vpm, index) => [
      index + 1,
      vpm.week_id ? 'Tuần ' + String(vpm.week_id).replace(/\D/g, '') : '—',
      vpm.create_at || vpm.created_at ? FormatDate(vpm.create_at || vpm.created_at) : '—',
      vpm.name_vp || vpm.bonus || 'Vi phạm',
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Styling rules matching mobile exportVipham.js
  const borderThin = {
    top: { style: 'thin', color: { rgb: 'D9D9D9' } },
    bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
    left: { style: 'thin', color: { rgb: 'D9D9D9' } },
    right: { style: 'thin', color: { rgb: 'D9D9D9' } },
  };

  const styleTitle = {
    fill: { fgColor: { rgb: '1F497D' } },
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const styleSection = {
    fill: { fgColor: { rgb: '2F5597' } },
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };

  const styleLabel = {
    fill: { fgColor: { rgb: 'EDF2F8' } },
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '333333' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin,
  };

  const styleValue = {
    fill: { fgColor: { rgb: 'FFFFFF' } },
    font: { name: 'Calibri', sz: 11, color: { rgb: '000000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin,
  };

  const styleAlertValue = {
    fill: { fgColor: { rgb: 'FCE4D6' } },
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'C00000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderThin,
  };

  const styleTableHeader = {
    fill: { fgColor: { rgb: 'D9E1F2' } },
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1F497D' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin,
  };

  const applyStyleToRange = (rStart: number, cStart: number, rEnd: number, cEnd: number, style: any) => {
    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!worksheet[cellRef]) {
          worksheet[cellRef] = { t: 's', v: '' };
        }
        worksheet[cellRef].s = style;
      }
    }
  };

  // Title Banner (A1:D1)
  applyStyleToRange(0, 0, 0, 3, styleTitle);

  // Section 1: Thông tin học sinh (A3:D3)
  applyStyleToRange(2, 0, 2, 3, styleSection);

  // Student metadata rows 4..8
  for (let r = 3; r <= 7; r++) {
    applyStyleToRange(r, 0, r, 0, styleLabel);
    const isAlertRow = r === 7;
    applyStyleToRange(r, 1, r, 3, isAlertRow ? styleAlertValue : styleValue);
  }

  // Section 2: Danh sách vi phạm (A10:D10)
  applyStyleToRange(9, 0, 9, 3, styleSection);

  // Table Header (A11:D11)
  applyStyleToRange(10, 0, 10, 3, styleTableHeader);
  if (worksheet['D11']) {
    worksheet['D11'].s = {
      ...styleTableHeader,
      alignment: { horizontal: 'left', vertical: 'center' },
    };
  }

  // Data rows
  studentViolations.forEach((_, index) => {
    const r = 11 + index;
    const isEven = index % 2 === 1;
    const bgZebra = isEven ? { fgColor: { rgb: 'F9FAFC' } } : { fgColor: { rgb: 'FFFFFF' } };

    [0, 1, 2].forEach((c) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          fill: bgZebra,
          font: { name: 'Calibri', sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin,
        };
      }
    });

    const cellRefD = XLSX.utils.encode_cell({ r, c: 3 });
    if (worksheet[cellRefD]) {
      worksheet[cellRefD].s = {
        fill: bgZebra,
        font: { name: 'Calibri', sz: 11 },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: borderThin,
      };
    }
  });

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } },
    { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } },
    { s: { r: 7, c: 1 }, e: { r: 7, c: 3 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } },
  ];

  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 28 },
    { wch: 45 },
  ];

  worksheet['!rows'] = [
    { hpt: 32 },
    { hpt: 12 },
    { hpt: 22 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 12 },
    { hpt: 22 },
    { hpt: 22 },
  ];

  worksheet['!views'] = [{ showGridLines: true }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch sử vi phạm');

  const cleanDateStr = student.ngay_sinh ? getCleanDate(student.ngay_sinh) : 'N/A';
  XLSX.writeFile(workbook, `ViPham_${student.student_name}_${cleanDateStr}.xlsx`);
}
