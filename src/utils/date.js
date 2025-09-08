import dayjs from "dayjs";
import {convertFileList} from "../utils/convertFileList"
export const parseDayjsToDate = (dayjsObj) => {
  if (!dayjsObj) return null;
  if (dayjs.isDayjs(dayjsObj)) return dayjsObj.toDate();
  const d = dayjs(dayjsObj, "DD/MM/YYYY", true);
  return d.isValid() ? d.toDate() : null;
};

export const normalizeDate = (ts) => {
  if (!ts) return null;

  if (ts._seconds) return dayjs.unix(ts._seconds).format("DD/MM/YYYY");
  
  // Đã là dayjs object
  if (dayjs.isDayjs(ts)) return ts.format("DD/MM/YYYY");
  
  // Thử parse bằng dayjs
  try {
    const d = dayjs(ts);
    return d.isValid() ? d.format("DD/MM/YYYY") : null;
  } catch (error) {
    console.warn("Cannot normalize date:", ts, error);
    return null;
  }
};

// ✅ Hỗ trợ parse string dạng DD/MM/YYYY - Fixed version
export const toDayjsOrNull = (value) => {
  if (!value) return null;

  try {
    // Firestore Timestamp
    if (typeof value === "object" && "_seconds" in value) {
      return dayjs.unix(value._seconds);
    }

    // Nếu đã là dayjs object
    if (dayjs.isDayjs(value)) return value;

    // Nếu là Date
    if (value instanceof Date) return dayjs(value);

    // Nếu là string
    if (typeof value === "string") {
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed : null;
    }

    return null;
  } catch (err) {
    console.warn("⚠️ toDayjsOrNull error:", err, "value:", value);
    return null;
  }
};


// ✅ Helper function để xử lý nested object an toàn
export const safeProcessNestedObject = (obj, fieldName, hasXacNhan = false) => {
  if (!obj) {
    return hasXacNhan
      ? { xacNhan: false, ngay: null, dinhKem: [] }
      : { so: "", ngay: null, dinhKem: [] };
  }

  const result = {};

  if (!hasXacNhan) result.so = obj.so || "";
  if (hasXacNhan) result.xacNhan = Boolean(obj.xacNhan);

  // 🔑 Ép cứng obj.ngay về dayjs|null
  if (obj.ngay) {
    result.ngay = toDayjsOrNull(obj.ngay._seconds 
      ? new Date(obj.ngay._seconds * 1000) 
      : obj.ngay
    );
  } else {
    result.ngay = null;
  }

  result.dinhKem = convertFileList(obj.dinhKem) || [];
  return result;
};
