import { Form, Select } from "antd";

export default function SelectComponent({ name, label, options = [], required = false }) {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: `Vui lòng chọn ${label.toLowerCase()}` }] : []}
    >
      <Select placeholder={`Chọn ${label.toLowerCase()}`}>
        {options.map((opt) => (
          <Select.Option key={opt.value} value={opt.value}>
            {opt.label}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
}
