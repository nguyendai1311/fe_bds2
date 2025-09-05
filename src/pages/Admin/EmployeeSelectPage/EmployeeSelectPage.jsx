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
  // ================== Fetch data ==================
  const fetchData = async (page = 1, pageSize = 8, search = "") => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (mode === "add" || mode === "edit") {
        const res = await EmployeeService.getAllUser(user?.access_token, {
          page,
          limit: pageSize,
          search,
        });

        let userList = [];
        let totalCount = 0;
        let currentPage = page;
        let currentLimit = pageSize;

        if (Array.isArray(res)) {
          // Không phân biệt role nữa
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
          // Không lọc roles
          userList = res.data || [];
          totalCount = res.total || userList.length;
          currentPage = res.page || page;
          currentLimit = res.limit || pageSize;
        }

        setUsers(userList);
        setPagination({ total: totalCount, page: currentPage, pageSize: currentLimit });

        // Xử lý selectedRowKeys cho mode edit (giữ nguyên)
        if (mode === "edit") {
          let initialSelectedIds = [];

          const tempFormData = localStorage.getItem("tempFormData");
          if (tempFormData) {
            try {
              const tempData = JSON.parse(tempFormData);
              if (Array.isArray(tempData.selectedEmployees) && tempData.selectedEmployees.length > 0) {
                if (typeof tempData.selectedEmployees[0] === "string") {
                  initialSelectedIds = tempData.selectedEmployees;
                } else {
                  initialSelectedIds = tempData.selectedEmployees.map((e) => e.id);
                }
              }
            } catch (e) {
              console.error("Error parsing tempFormData:", e);
            }
          }

          if (!initialSelectedIds.length && selectedEmployees.length > 0) {
            if (typeof selectedEmployees[0] === "string") {
              initialSelectedIds = selectedEmployees;
            } else {
              initialSelectedIds = selectedEmployees.map((e) => e.id);
            }
          }

          if (!initialSelectedIds.length && id && id !== "new") {
            try {
              const projectRes = await EmployeeService.getUsersByProject(
                id,
                user?.access_token
              );
              if (projectRes?.success && projectRes.data) {
                initialSelectedIds = projectRes.data.map((e) => e.id);
              }
            } catch (error) {
              console.error("Error fetching project employees:", error);
            }
          }

          setSelectedRowKeys(initialSelectedIds);
        }
      }

      if (mode === "view" && id) {
        const res = await EmployeeService.getUsersByProject(
          id,
          user?.access_token,
          { page, limit: pageSize, search }
        );

        if (res?.success) {
          setUsers(res.data || []);
          setPagination({
            total: res.total || (res.data || []).length,
            page: res.page || page,
            pageSize: res.limit || pageSize
          });
        }
      }
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize);
  }, [id, mode]);

  // Thêm useEffect để sync với Redux khi selectedEmployees thay đổi từ bên ngoài
  useEffect(() => {
    if (mode === "edit" && selectedEmployees.length > 0) {
      // FIX: Kiểm tra xem selectedEmployees là array of IDs hay array of objects
      let reduxSelectedIds = [];

      if (typeof selectedEmployees[0] === 'string') {
        // Nếu là array of strings (IDs)
        reduxSelectedIds = selectedEmployees;
      } else if (typeof selectedEmployees[0] === 'object' && selectedEmployees[0]?.id) {
        // Nếu là array of objects
        reduxSelectedIds = selectedEmployees.map(e => e.id);
      }

      console.log("=== Redux Sync Employees ===");
      console.log("selectedEmployees type:", typeof selectedEmployees[0]);
      console.log("reduxSelectedIds:", reduxSelectedIds);

      setSelectedRowKeys(reduxSelectedIds);
    }
  }, [selectedEmployees, mode]);

  // ================== Confirm chọn nhân viên ==================
  const handleConfirm = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      // Lấy thông tin chi tiết của các nhân viên được chọn
      const selectedDetails = await Promise.all(
        selectedRowKeys.map(async (id) => {
          const userInList = users.find(u => u.id === id);
          if (userInList) {
            return userInList;
          }
          // Nếu không có trong danh sách hiện tại, gọi API lấy chi tiết
          try {
            const res = await EmployeeService.getDetailsUser(id, user?.access_token);
            return res?.data || res;
          } catch (error) {
            console.error("Error fetching user details:", error);
            return null;
          }
        })
      );

      const validEmployees = selectedDetails.filter(Boolean).map(emp => ({ id: emp.id, name: emp.name, email: emp.email }));

      // Cập nhật Redux
      dispatch(setSelectedEmployees(validEmployees));

      // Lấy tempFormData hiện tại
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

      // Cập nhật reopenModal
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

      console.log("=== Updated Employee Data ===");
      console.log("Selected Employees:", validEmployees);
      console.log("TempFormData:", updatedTempData);

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
    localStorage.setItem(
      "reopenModal",
      JSON.stringify({ type: "view", projectId: id })
    );
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
      render: (roles) => Array.isArray(roles) ? roles.join(", ") : roles
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/detail/user/${record.id}`)}>
          Xem chi tiết
        </Button>
      ),
    }
  ];

  // ===== DEBUG: Log để tracking =====
  useEffect(() => {
    console.log("=== UsersByProjectPage State ===");
    console.log("Selected Row Keys:", selectedRowKeys);
    console.log("Redux selectedEmployees:", selectedEmployees);
    console.log("Users length:", users.length);
    console.log("Mode:", mode);
    console.log("TempFormData:", localStorage.getItem("tempFormData"));
  }, [selectedRowKeys, selectedEmployees, users, mode]);

  return (
    <Card
      title={`Danh sách Nhân viên trong dự án (${mode === "view" ? "Xem" : mode === "add" ? "Thêm" : "Sửa"})`}
      style={{ margin: 24 }}
      extra={
        (mode === "add" || mode === "edit") && (
          <div style={{ fontSize: "14px", color: "#666" }}>
            Đã chọn: {selectedRowKeys.length} nhân viên
          </div>
        )
      }
    >
      <Spin spinning={loading}>
        <Input
          placeholder="Tìm theo tên hoặc email"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onPressEnter={() => fetchData(1, pagination.pageSize, searchKeyword)}
          style={{ width: 300, height: 40, marginBottom: 16 }}
        />

        <Table
          dataSource={users}
          rowKey="id"
          size="small"
          rowSelection={
            mode === "add" || mode === "edit"
              ? {
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                type: "checkbox"
              }
              : undefined
          }
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchData(page, pageSize, searchKeyword),
            showTotal: (total) => `Tổng ${total} nhân viên`
          }}
          columns={columns}
        />

        {(mode === "add" || mode === "edit") && (
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button style={{ marginRight: 8 }} onClick={handleCancel}>
              Hủy
            </Button>
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