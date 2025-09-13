import { Form, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function UploadComponent({ name, label, required = false }) {
  return (
    <Form.Item
      name={name}
      label={label}
      valuePropName="fileList"
      getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
      rules={required ? [{ required: true, message: `Vui lòng tải lên ${label.toLowerCase()}` }] : []}
    >
      <Upload beforeUpload={() => false}>
        <button className="ant-btn ant-btn-default">
          <UploadOutlined /> Tải lên
        </button>
      </Upload>
    </Form.Item>
  );
}
