import * as XLSX from "xlsx";

export function formatDate(ts) {
  if (!ts || !ts._seconds) return "";
  return new Date(ts._seconds * 1000).toLocaleDateString("vi-VN");
}

export function exportToExcel(rows, fileName, mapping) {
  if (!rows || rows.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Chuẩn hóa dữ liệu theo mapping
  const exportData = rows.map((item) => {
    const row = {};
    for (const key in mapping) {
      const columnName = mapping[key];
      const value = item[key];

      // Nếu field là timestamp thì format
      if (value && value._seconds) {
        row[columnName] = formatDate(value);
      } else {
        row[columnName] = value ?? "";
      }
    }
    return row;
  });

  // Tạo sheet và workbook
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // Xuất file
  XLSX.writeFile(workbook, fileName);
}
