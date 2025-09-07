import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spin, Button, Table, message, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedEmployees } from "../../../redux/slices/projectSlice";
import * as EmployeeService from "../../../services/UserService";

export default function UsersByProjectPage() {
  const { id, mode } = useParams(); // mode = view | add | edit
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 8 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const selectedEmployees = useSelector(
    (state) => state.project?.selectedEmployees || []
  );

  // ================== Fetch data ==================
  const fetchData = async (page = 1, pageSize = 8, search = "") => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      let userList = [];
      let totalCount = 0;

      if (mode === "add" || mode === "edit") {
        const res = await EmployeeService.getAllUser(user?.access_token, {
          page,
          limit: pageSize,
          search,
        });

        if (Array.isArray(res)) {
          userList = res;
          if (search) {
            const searchLower = search.toLowerCase();
            userList = userList.filter(u =>
              u.name?.toLowerCase().includes(searchLower) ||
              u.email?.toLowerCase().includes(searchLower)
            );
          }
          totalCount = userList.length;
          userList = userList.slice((page - 1) * pageSize, page * pageSize);
        } else if (res?.success) {
          userList = res.data || [];
          totalCount = res.total || userList.length;
        }
      }

      if (mode === "view" && id) {
        const res = await EmployeeService.getUsersByProject(
          id,
          user?.access_token,
          { page, limit: pageSize, search }
        );
        if (res?.success) {
          userList = res.data || [];
          totalCount = res.total || userList.length;
        }
      }

      setUsers(userList);
      setPagination({ total: totalCount, page, pageSize });
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  // ================== Init / Sync selectedRowKeys ==================
  useEffect(() => {
    fetchData(1, pagination.pageSize);
  }, [id, mode]);

  useEffect(() => {
    if ((mode === "edit" || mode === "add") && selectedEmployees.length > 0) {
      let ids = typeof selectedEmployees[0] === "string"
        ? selectedEmployees
        : selectedEmployees.map(e => e.id);
      setSelectedRowKeys(ids);
    }
  }, [selectedEmployees, mode]);

  // ================== Confirm chọn nhân viên ==================
  const handleConfirm = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const selectedDetails = await Promise.all(
        selectedRowKeys.map(async (id) => {
          const localUser = users.find(u => u.id === id);
          if (localUser) return localUser;

          try {
            const res = await EmployeeService.getDetailsUser(id, user?.access_token);
            return res?.data || res;
          } catch (err) {
            console.error("Error fetching user details:", err);
            return null;
          }
        })
      );

      const validEmployees = selectedDetails
        .filter(Boolean)
        .map(emp => ({ id: emp.id, name: emp.name, email: emp.email }));

      dispatch(setSelectedEmployees(validEmployees));

      const existingTempData = JSON.parse(localStorage.getItem("tempFormData") || "{}");
      const updatedTempData = {
        ...existingTempData,
        selectedEmployees: validEmployees,
        selectedHouseholds: existingTempData.selectedHouseholds || [],
        selectedLandPrices: existingTempData.selectedLandPrices || [],
        formValues: existingTempData.formValues || {},
        timestamp: Date.now(),
        lastModified: "employees",
      };
      localStorage.setItem("tempFormData", JSON.stringify(updatedTempData));

      const reopenData = {
        type: id === "new" ? "add" : "edit",
        projectId: id === "new" ? "new" : id,
        restoreData: {
          formValues: updatedTempData.formValues,
          selectedEmployees: updatedTempData.selectedEmployees,
          selectedHouseholds: updatedTempData.selectedHouseholds,
          selectedLandPrices: updatedTempData.selectedLandPrices,
        },
      };
      localStorage.setItem("reopenModal", JSON.stringify(reopenData));

      message.success("Đã chọn/cập nhật nhân viên thành công!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra!");
    }
  };

  // ================== Cancel ==================
  const handleCancel = () => {
    const existingTempData = JSON.parse(localStorage.getItem("tempFormData") || "{}");
    const reopenData = {
      type: id === "new" ? "add" : "edit",
      projectId: id === "new" ? "new" : id,
      restoreData: {
        formValues: existingTempData.formValues || {},
        selectedEmployees: existingTempData.selectedEmployees || [],
        selectedHouseholds: existingTempData.selectedHouseholds || [],
        selectedLandPrices: existingTempData.selectedLandPrices || [],
      },
    };
    localStorage.setItem("reopenModal", JSON.stringify(reopenData));
    navigate(-1);
  };

  const handleBackView = () => {
    localStorage.setItem("reopenModal", JSON.stringify({ type: "view", projectId: id }));
    navigate(-1);
  };

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, searchKeyword);
  };

  // ================== Columns ==================
  const columns = [
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Tên", dataIndex: "name", key: "name" },
    {
      title: "Vai trò",
      dataIndex: "roles",
      key: "roles",
      render: roles => Array.isArray(roles) ? roles.join(", ") : roles
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/detail/user/${record.id}`)}>
          Xem chi tiết
        </Button>
      )
    }
  ];

  return (
    <Card
      title={`Danh sách Nhân viên trong dự án (${mode === "view" ? "Xem" : mode === "add" ? "Thêm" : "Sửa"})`}
      style={{ margin: 24 }}
      extra={(mode === "add" || mode === "edit") && (
        <div style={{ fontSize: 14, color: "#666" }}>
          Đã chọn: {selectedRowKeys.length} nhân viên
        </div>
      )}
    >
      <Spin spinning={loading}>
        <Input
          placeholder="Tìm theo tên hoặc email"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 300, height: 40, marginBottom: 16 }}
        />

        <Table
          dataSource={users}
          rowKey="id"
          size="small"
          rowSelection={(mode === "add" || mode === "edit") ? {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            type: "checkbox",
            preserveSelectedRowKeys: true, // giữ select khi đổi trang/search
          } : undefined}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchData(page, pageSize, searchKeyword),
            showTotal: total => `Tổng ${total} nhân viên`
          }}
          columns={columns}
        />

        {(mode === "add" || mode === "edit") && (
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button style={{ marginRight: 8 }} onClick={handleCancel}>Hủy</Button>
            <Button type="primary" onClick={handleConfirm} disabled={!selectedRowKeys.length}>
              {mode === "add" ? "Xác nhận chọn" : "Cập nhật"} ({selectedRowKeys.length} nhân viên)
            </Button>
          </div>
        )}

        {mode === "view" && (
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button onClick={handleBackView}>Quay lại</Button>
          </div>
        )}
      </Spin>
    </Card>
  );
}
