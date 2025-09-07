import { useState, useEffect } from "react";
import { Table, Input, message, Spin, Avatar, Button, Modal, Form, Select, Dropdown } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import * as UserService from "../../../services/UserService";
import { FiMoreVertical } from "react-icons/fi";
import { FilterContainer, HeaderActions } from "./style";

const { Option } = Select;

export default function EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 8;

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem("user"));

  const getColorByChar = (char) => {
    const colors = ["#2563eb", "#f97316", "#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#9333ea"];
    return colors[char.charCodeAt(0) % colors.length];
  };

  // ======== Lấy danh sách nhân viên từ server (có phân trang + search) ========
  const fetchEmployees = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await UserService.getAllUser(user?.access_token, { page, limit: pageSize, search });
      const employeeList = res?.data?.map(emp => ({
        key: emp.id || emp._id,
        name: emp.name || emp.email.split("@")[0],
        email: emp.email,
        role: Array.isArray(emp.roles) ? emp.roles.join(", ") : emp.roles || "employee",
        avatar: emp.avatar || "",
      })) || [];
      setEmployees(employeeList);
      setTotalItems(res?.total || 0);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  // ===== Fetch khi load trang hoặc thay đổi currentPage =====
  useEffect(() => {
    fetchEmployees(currentPage, searchName);
  }, [currentPage]);

  // ===== Xóa nhân viên =====
  const handleDelete = (record) => {
    setCurrentEmployee(record);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentEmployee?.key) return message.error("UID không hợp lệ");
    try {
      await UserService.deleteUser(currentEmployee.key, user?.access_token);
      message.success(`Đã xóa nhân viên: ${currentEmployee.name}`);
      fetchEmployees(currentPage, searchName);
      setIsDeleteModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error(err?.message || "Xóa nhân viên thất bại!");
    }
  };

  // ===== Thêm nhân viên =====
  const handleAddEmployee = async () => {
    try {
      const values = await form.validateFields();
      setAdding(true);
      await UserService.createUser(values, user?.access_token);
      message.success("Thêm nhân viên thành công!");
      form.resetFields();
      setIsAddModalVisible(false);
      setCurrentPage(1); // reset trang đầu tiên
      fetchEmployees(1, searchName);
    } catch (err) {
      console.error(err);
      message.error(err?.message || "Thêm nhân viên thất bại!");
    } finally {
      setAdding(false);
    }
  };

  const handleView = async (record) => {
    try {
      const res = await UserService.getDetailsUser(record.key, user?.access_token);
      setViewEmployee(res?.data || {});
      setIsViewModalVisible(true);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải chi tiết nhân viên!");
    }
  };

  // ====== Sửa nhân viên ======
  const handleEdit = async (record) => {
    try {
      const res = await UserService.getDetailsUser(record.key, user?.access_token);
      editForm.setFieldsValue({
        name: res?.data?.name,
        email: res?.data?.email,
        roles: res?.data?.roles,
      });
      setCurrentEmployee({ key: record.key });
      setIsEditModalVisible(true);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu để sửa!");
    }
  };

  const handleUpdateEmployee = async () => {
    try {
      const values = await editForm.validateFields();
      setEditing(true);
      await UserService.updateUser(currentEmployee.key, values, user?.access_token);
      message.success("Cập nhật nhân viên thành công!");
      setIsEditModalVisible(false);
      fetchEmployees(currentPage, searchName);
    } catch (err) {
      console.error(err);
      message.error(err?.message || "Cập nhật nhân viên thất bại!");
    } finally {
      setEditing(false);
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      render: (text, record) => {
        const initial = (record.name || record.email || "NV")[0].toUpperCase();
        return text ? (
          <Avatar src={text} size={48} />
        ) : (
          <Avatar style={{ backgroundColor: getColorByChar(initial), fontWeight: "bold" }} size={48}>
            {initial}
          </Avatar>
        );
      },
    },
    { title: "Tên nhân viên", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const items = [
          { key: "view", label: "Xem chi tiết", icon: <EyeOutlined />, onClick: () => handleView(record) },
          { key: "edit", label: "Sửa", icon: <EditOutlined />, onClick: () => handleEdit(record) },
          { key: "delete", label: "Xóa", icon: <DeleteOutlined />, onClick: () => handleDelete(record) },
        ];
        return (
          <Dropdown menu={{ items, onClick: e => items.find(i => i.key === e.key)?.onClick?.() }} trigger={["click"]}>
            <Button type="link">
              <FiMoreVertical className="text-xl text-gray-600 hover:text-blue-600" />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="p-1">
      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-4">Quản lý nhân viên</h2>
      </div>

      <FilterContainer className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm nhân viên theo tên hoặc email"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          onPressEnter={() => {
            setCurrentPage(1); // reset trang đầu tiên
            fetchEmployees(1, searchName); // gọi API khi Enter
          }}
          className="w-64 h-10"
        />

        <HeaderActions>
          <Button type="primary" onClick={() => { setIsAddModalVisible(true); form.resetFields(); }}>
            Thêm nhân viên
          </Button>
        </HeaderActions>
      </FilterContainer>

      <Spin spinning={loading}>
        <div className="bg-white rounded-2xl shadow p-4">
          <Table
            columns={columns}
            dataSource={employees}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalItems,
              onChange: (page) => setCurrentPage(page),
            }}
            size="small"
            bordered
            rowKey="key"
          />
        </div>
      </Spin>

      {/* Modal Xóa */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn xóa nhân viên {currentEmployee?.name}?</p>
      </Modal>

      {/* Modal Thêm */}
      <Modal
        title="Thêm nhân viên"
        open={isAddModalVisible}
        onOk={handleAddEmployee}
        onCancel={() => { setIsAddModalVisible(false); form.resetFields(); }}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={adding}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tên nhân viên" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="roles" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="Chọn role">
              <Option value="employee">Employee</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Thông tin nhân viên"
        open={isViewModalVisible}
        footer={null}
        onCancel={() => setIsViewModalVisible(false)}
      >
        {viewEmployee ? (
          <div>
            <p><b>Tên:</b> {viewEmployee.name}</p>
            <p><b>Email:</b> {viewEmployee.email}</p>
            <p><b>Role:</b> {Array.isArray(viewEmployee.roles) ? viewEmployee.roles.join(", ") : viewEmployee.roles}</p>
            <p><b>SĐT:</b> {viewEmployee.phone || "Chưa có"}</p>
            <p><b>Địa chỉ:</b> {viewEmployee.full_address || "Chưa có"}</p>
          </div>
        ) : (
          <Spin />
        )}
      </Modal>

      {/* Modal Sửa */}
      <Modal
        title="Sửa nhân viên"
        open={isEditModalVisible}
        onOk={handleUpdateEmployee}
        onCancel={() => setIsEditModalVisible(false)}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={editing}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Tên nhân viên" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="roles" rules={[{ required: true }]}>
            <Select mode="multiple">
              <Option value="employee">Employee</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
