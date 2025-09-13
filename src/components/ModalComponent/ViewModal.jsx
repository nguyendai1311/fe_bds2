import { Modal, Row, Col, Divider } from "antd";
import dayjs from "dayjs";

const renderValue = (val, type) => {
  if (!val) return "Chưa có thông tin";

  switch (type) {
    case "date":
      return val;
    case "checkbox":
      return val ? "✔️" : "❌";

    case "upload":
      if (Array.isArray(val) && val.length > 0) {
        return (
          <>
            {val.map((file, idx) => (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                style={{ marginRight: 8 }}
              >
                {file.originalname || file.name || `File ${idx + 1}`}
              </a>
            ))}
          </>
        );
      }
      if (val.url) {
        return (
          <>
            <strong>Đính kèm: </strong>
            <a href={val.url} target="_blank" rel="noreferrer">
              {val.originalname || val.name || "Xem file"}
            </a>
          </>
        );
      }
      return (
        <>
          Chưa có file
        </>
      );

    default:
      return String(val);
  }
};

export default function ViewModal({
  visible,
  onCancel,
  title,
  width = 1200,
  sections = [],
  record = {},
  children
}) {
  const renderField = (field, idx) => {
    if (field.group) {
      return (
        <Row key={idx} gutter={16} style={{ marginBottom: 12 }}>
          {field.label && (
            <Col span={4} style={{ fontWeight: 500 }}>
              {field.label}:
            </Col>
          )}
          <Col span={20}>
            <Row gutter={16}>
              {field.group.map((g, i) => {
                const value = Array.isArray(g.name)
                  ? g.name.reduce((acc, key) => acc?.[key], record)
                  : record?.[g.name];

                return (
                  <Col key={i} span={g.inputCol || 8}>
                    {g.label && (
                      <span style={{ fontWeight: 500 }}>{g.label}: </span>
                    )}
                    <span>{renderValue(value, g.type)}</span>
                  </Col>
                );
              })}
            </Row>
          </Col>
        </Row>
      );
    }

    const value = Array.isArray(field.name)
      ? field.name.reduce((acc, key) => acc?.[key], record)
      : record?.[field.name];

    return (
      <Row key={idx} gutter={16} style={{ marginBottom: 12 }}>
        {field.label && (
          <Col span={field.labelCol || 4} style={{ fontWeight: 500 }}>
            {field.label}:
          </Col>
        )}
        <Col span={field.valueCol || field.inputCol || 20}>
          {renderValue(value, field.type)}
        </Col>
      </Row>
    );
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={[
        <button key="close" onClick={onCancel}>
          Đóng
        </button>,
      ]}
      width={width}
    >
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.title && (
            <Divider orientation="left">{section.title}</Divider>
          )}
          {section.fields?.map((f, i) => renderField(f, i))}
        </div>
      ))} 
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </Modal>
  );
}
