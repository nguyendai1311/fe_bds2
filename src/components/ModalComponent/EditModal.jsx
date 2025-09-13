import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  Checkbox,
  DatePicker,
  Select,
  Upload,
  Button,
  Divider,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function EditModal({
  visible,
  onOk,
  onCancel,
  loading = false,
  form,
  title,
  width = 1200,
  sections = [],
  children
}) {
  const renderInput = (field) => {
    const { label, type = "input", options } = field;

    switch (type) {
      case "input":
        return <Input placeholder={label} />;
      case "number":
        return (
          <InputNumber
            style={{ width: "100%" }}
            placeholder={label}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => v.replace(/,/g, "")}
            controls={false}
          />
        );
      case "checkbox":
        return <Checkbox>{label}</Checkbox>;
      case "date":
        return <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }}  />;
      case "select":
        return (
          <Select placeholder={label}>
            {options?.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "upload":
        return (
          <Upload beforeUpload={() => false} multiple>
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        );
      default:
        return <Input placeholder={label} />;
    }
  };

  const renderField = (field, idx) => {
    // ✅ Trường hợp group field (1 hàng nhiều input)
    if (field.group) {
      return (
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }} key={idx}>
          {field.label && (
            <Col span={4}>
              <label style={{ fontWeight: 500 }}>{field.label}:</label>
            </Col>
          )}
          <Col span={20}>
            <Row gutter={16}>
              {field.group.map((g, i) => (
                <Col key={i} span={g.inputCol || 8}>
                  <Form.Item
                    name={g.name}
                    valuePropName={
                      g.type === "checkbox"
                        ? "checked"
                        : g.type === "upload"
                          ? "fileList"
                          : undefined
                    }
                    getValueFromEvent={
                      g.type === "upload" ? (e) => e?.fileList || [] : undefined
                    }
                    style={{ marginBottom: 0 }}
                  >
                    {renderInput(g)}
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      );
    }

    // ✅ Trường hợp field đơn
    const { name, label, type = "input", isCheckbox, labelCol = 4, inputCol = 8 } = field;
    return (
      <Row gutter={16} align="middle" style={{ marginBottom: 16 }} key={name}>
        {label && !isCheckbox && (
          <Col span={labelCol}>
            <label style={{ fontWeight: 500 }}>{label}:</label>
          </Col>
        )}
        <Col span={inputCol}>
          <Form.Item
            name={name}
            valuePropName={
              type === "checkbox" ? "checked" : type === "upload" ? "fileList" : undefined
            }
            getValueFromEvent={type === "upload" ? (e) => e?.fileList || [] : undefined}
            style={{ marginBottom: 0 }}
          >
            {renderInput(field)}
          </Form.Item>
        </Col>
      </Row>
    );
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      width={width}
      destroyOnClose
    >
      <Form form={form} layout="horizontal">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.title && <Divider orientation="left">{section.title}</Divider>}
            {section.fields?.map((f, i) => renderField(f, i))}
          </div>
        ))}
      </Form>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </Modal>
  );
}
