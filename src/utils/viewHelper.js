// Lấy dữ liệu theo path (string hoặc array)
export const getValue = (obj, path) => {
  if (!path) return undefined;
  if (Array.isArray(path)) {
    return path.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }
  return obj?.[path];
};

// Format value theo type
export const formatValue = (val, type) => {
  if (val == null || val === "") return null;

  switch (type) {
    case "date":
      return new Date(val).toLocaleDateString("vi-VN");

    case "checkbox":
      return val ? "Có" : "Không";

    case "number":
      return new Intl.NumberFormat("vi-VN").format(val);

    case "upload":
      if (Array.isArray(val)) {
        return val.map((f, i) => (
          <a
            key={i}
            href={f.url || f.thumbUrl}
            target="_blank"
            rel="noreferrer"
          >
            {f.name || f.filename || `File ${i + 1}`}
          </a>
        ));
      }
      return null;

    default:
      return String(val);
  }
};

// Chuyển sections của FormModal -> ViewModal
export const mapToViewSections = (formSections, citizen) => {
  return formSections.map((section) => ({
    title: section.title,
    fields: section.fields.map((f) => {
      const rawValue = getValue(citizen, f.name);
      return {
        label: f.label,
        labelCol: f.labelCol,
        valueCol: f.inputCol || f.valueCol,
        value: formatValue(rawValue, f.type),
      };
    }),
  }));
};
