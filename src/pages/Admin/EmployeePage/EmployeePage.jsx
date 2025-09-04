import { useState, useEffect } from "react";
import {
  Table,
  Input,
  message,
  Spin,
  Avatar,
  Tooltip,
  Button,
  Modal,
  Form,
  Select,
  Menu,
  Dropdown,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import * as UserService from "../../../services/UserService";
import { FiMoreVertical } from "react-icons/fi";
import { FilterContainer, HeaderActions, PageHeader } from "./style";

const { Option } = Select;

export default function EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem("user"));

  // Lấy màu nền avatar dựa theo ký tự đầu (ổn định, không random mỗi lần reload)
  const getColorByChar = (char) => {
    const colors = [
      "#2563eb", // blue-600
      "#f97316", // orange-500
      "#7c3aed", // violet-600
      "#f59e0b", // amber-500
      "#10b981", // emerald-500
      "#ef4444", // red-500
      "#06b6d4", // cyan-500
      "#9333ea", // purple-600
    ];
    const index = char.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Lấy danh sách nhân viên
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await UserService.getAllUser(user?.access_token);
        const employeeList =
          res?.map((emp, index) => ({
            key: emp.id || index.toString(),
            name: emp.name || emp.email.split("@")[0],
            email: emp.email,
            role: emp.roles?.join(", ") || "employee",
            avatar: emp.avatar || "",
          })) || [];
        setEmployees(employeeList);
        setFilteredEmployees(employeeList);
      } catch (err) {
        message.error("Không thể tải danh sách nhân viên");
      }
      setLoading(false);
    };
    fetchEmployees();
  }, [user?.access_token]);

  // Xóa nhân viên
  const handleDelete = (record) => {
    setCurrentEmployee(record);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentEmployee?.key) {
      message.error("UID nhân viên không hợp lệ!");
      setIsDeleteModalVisible(false);
      return;
    }
    try {
      await UserService.deleteUser(currentEmployee.key, user?.access_token);
      message.success(`Đã xóa nhân viên: ${currentEmployee.name}`);
      setEmployees((prev) =>
        prev.filter((emp) => emp.key !== currentEmployee.key)
      );
      setFilteredEmployees((prev) =>
        prev.filter((emp) => emp.key !== currentEmployee.key)
      );
      setIsDeleteModalVisible(false);
    } catch (err) {
      console.log(err);
      message.error(err?.message || "Xóa nhân viên thất bại!");
    }
  };

  // Thêm nhân viên
  const handleAddEmployee = async () => {
    try {
      const values = await form.validateFields();
      setAdding(true);
      const newEmp = await UserService.createUser(values, user?.access_token);
      const newEmployee = {
        key: newEmp.id || newEmp._id,
        name: newEmp.name,
        email: newEmp.email,
        role: Array.isArray(newEmp.roles)
          ? newEmp.roles.join(", ")
          : newEmp.roles || "employee",
        avatar: newEmp.avatar || "",
      };

      setEmployees((prev) => [...prev, newEmployee]);

      setFilteredEmployees((prev) => {
        const keyword = searchName.toLowerCase();
        if (!keyword) return [...prev, newEmployee];
        if (
          newEmployee.name.toLowerCase().includes(keyword) ||
          newEmployee.email.toLowerCase().includes(keyword)
        ) {
          return [...prev, newEmployee];
        }
        return prev;
      });

      message.success("Thêm nhân viên thành công!");
      form.resetFields();
      setIsAddModalVisible(false);
    } catch (err) {
      console.log(err);
      message.error(err?.message || "Thêm nhân viên thất bại!");
    } finally {
      setAdding(false);
    }
  };

  // Tìm kiếm nhân viên
  useEffect(() => {
    const keyword = searchName.toLowerCase();
    const results = employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(keyword) ||
        emp.email?.toLowerCase().includes(keyword)
    );
    setFilteredEmployees(results);
  }, [searchName, employees]);

  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      render: (text, record) => {
        const name = record.name || record.email || "NV";
        const initial = name.charAt(0).toUpperCase();

        return text ? (
          <Avatar src={text} size={48} />
        ) : (
          <Avatar
            style={{
              backgroundColor: getColorByChar(initial),
              verticalAlign: "middle",
              fontWeight: "bold",
            }}
            size={48}
          >
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
          {
            key: "view",
            label: "Xem chi tiết",
            icon: <EyeOutlined />,
            onClick: () => { console.log("Xem chi tiết", record) },
          },
          {
            key: "edit",
            label: "Sửa",
            icon: <EditOutlined />,
            onClick: () => { console.log("sua nhan vien", record) },
          },
          {
            key: "delete",
            label: "Xóa",
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <Dropdown
            menu={{
              items,
              onClick: (e) => {
                const item = items.find((i) => i.key === e.key);
                if (item?.onClick) item.onClick();
              },
            }}
            trigger={["click"]}
          >
            <Button type="link">
              <FiMoreVertical className="text-xl text-gray-600 hover:text-blue-600" />
            </Button>

          </Dropdown>
        );
      },
    }

  ];

  return (

    <div className="p-1">
      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-4">          Quản lý nhân viên
        </h2>
      </div>
      <FilterContainer className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm nhân viên theo tên hoặc email"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-64 h-10"
        />
        <HeaderActions>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsAddModalVisible(true);
              form.resetFields();
            }}
          >
            Thêm nhân viên
          </Button>
        </HeaderActions>
      </FilterContainer>

      <Spin spinning={loading}>
        <div className="bg-white rounded-2xl shadow p-4 max-h-[70vh] overflow-y-auto">
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            pagination={{ pageSize: 8 }}
            size="small"
            bordered
            rowKey="key"
            className="text-sm [&_.ant-table]:text-sm [&_.ant-table-cell]:px-3 [&_.ant-table-cell]:py-2"
          />
        </div>
      </Spin>

      {/* Modal xóa */}
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

      {/* Modal thêm */}
      <Modal
        title="Thêm nhân viên"
        open={isAddModalVisible}
        onOk={handleAddEmployee}
        onCancel={() => {
          setIsAddModalVisible(false);
          form.resetFields();
        }}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={adding}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên nhân viên"
            name="name"
            rules={[{ required: true, message: "Nhập tên nhân viên!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Role"
            name="roles"
            rules={[{ required: true, message: "Chọn role!" }]}
          >
            <Select mode="multiple" placeholder="Chọn role">
              <Option value="employee">Employee</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, type: "email", message: "Nhập email hợp lệ!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu!" }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
