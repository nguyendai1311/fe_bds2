import { Modal } from "antd";

/**
 * ConfirmDeleteModal - modal xác nhận xóa dùng chung
 *
 * @param {boolean} visible - hiển thị hay không
 * @param {function} onOk - callback khi xác nhận
 * @param {function} onCancel - callback khi hủy
 * @param {string} entityName - tên loại dữ liệu (vd: "hộ dân", "người dùng")
 * @param {string} itemName - tên cụ thể để hiển thị (vd: "Nguyễn Văn A")
 * @param {boolean} loading - trạng thái đang xử lý
 */
export default function ConfirmDeleteModal({
  visible,
  onOk,
  onCancel,
  entityName = "bản ghi",
  itemName,
  loading = false,
}) {
  return (
    <Modal
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Xóa"
      okButtonProps={{ danger: true }}
      cancelText="Hủy"
      title={`Xác nhận xóa ${entityName}`}
    >
      <p>
        Bạn có chắc chắn muốn xóa{" "}
        <strong>{itemName || entityName}</strong> không?
      </p>
    </Modal>
  );
}
