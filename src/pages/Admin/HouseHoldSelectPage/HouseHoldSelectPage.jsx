import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spin, Button, Table, message, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedHouseholds } from "../../../redux/slices/projectSlice";
import * as HouseholdService from "../../../services/CitizenService";

export default function DetailPage() {
  const { id, mode } = useParams(); // mode = view | add | edit
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 8 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tempSelectedRowKeys, setTempSelectedRowKeys] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const selectedHouseholds = useSelector(
    state => state.project?.selectedHouseholds || []
  );

  // ================== Fetch data ==================
  const fetchData = async (page = 1, pageSize = 8, search = "") => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      let householdList = [];
      let totalCount = 0;

      if (mode === "add" || mode === "edit") {
        const res = await HouseholdService.getAll(user?.access_token, {
          page,
          limit: pageSize,
          search
        });

        if (res?.success) {
          householdList = res.data || [];
          totalCount = res.total || householdList.length;
          setHouseholds(householdList);
          setPagination({ total: totalCount, page, pageSize });

          // Init tempSelectedRowKeys (only once)
          if (mode === "edit" && tempSelectedRowKeys.length === 0) {
            let initialSelectedIds = [];

            const tempFormData = localStorage.getItem("tempFormData");
            if (tempFormData) {
              try {
                const tempData = JSON.parse(tempFormData);
                if (Array.isArray(tempData.selectedHouseholds) && tempData.selectedHouseholds.length > 0) {
                  initialSelectedIds = typeof tempData.selectedHouseholds[0] === "string"
                    ? tempData.selectedHouseholds
                    : tempData.selectedHouseholds.map(h => h.id);
                }
              } catch (err) {
                console.error("Error parsing tempFormData:", err);
              }
            }

            if (initialSelectedIds.length === 0 && selectedHouseholds.length > 0) {
              initialSelectedIds = typeof selectedHouseholds[0] === "string"
                ? selectedHouseholds
                : selectedHouseholds.map(h => h.id);
            }

            if (initialSelectedIds.length === 0 && id && id !== "new") {
              try {
                const projectRes = await HouseholdService.getHouseholdsByProject(
                  id, 1, 1000, "", user?.access_token
                );
                if (projectRes?.success && projectRes.data) {
                  initialSelectedIds = projectRes.data.map(h => h.id);
                }
              } catch (err) {
                console.error("Error fetching project households:", err);
              }
            }

            setTempSelectedRowKeys(initialSelectedIds);
          }
        }
      }

      if (mode === "view" && id) {
        const res = await HouseholdService.getHouseholdsByProject(
          id, page, pageSize, search, user?.access_token
        );
        if (res?.success) {
          householdList = res.data || [];
          totalCount = res.total || householdList.length;
          setHouseholds(householdList);
          setPagination({ total: totalCount, page, pageSize });
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

  // ================== Sync selectedRowKeys với tempSelectedRowKeys ==================
  useEffect(() => {
    const currentPageKeys = households.map(h => h.id);
    const currentSelectedKeys = tempSelectedRowKeys.filter(k => currentPageKeys.includes(k));
    setSelectedRowKeys(currentSelectedKeys);
  }, [households, tempSelectedRowKeys]);

  // ================== Confirm chọn hộ dân ==================
  const handleConfirm = () => {
    try {
      const validHouseholds = tempSelectedRowKeys.map(id => ({ id }));

      dispatch(setSelectedHouseholds(validHouseholds));

      const existingTempData = JSON.parse(localStorage.getItem("tempFormData") || "{}");
      const updatedTempData = {
        ...existingTempData,
        selectedHouseholds: validHouseholds,
        selectedEmployees: existingTempData.selectedEmployees || [],
        selectedLandPrices: existingTempData.selectedLandPrices || [],
        formValues: existingTempData.formValues || {},
        timestamp: Date.now(),
        lastModified: "households"
      };
      localStorage.setItem("tempFormData", JSON.stringify(updatedTempData));

      const reopenData = {
        type: id === "new" ? "add" : "edit",
        projectId: id === "new" ? "new" : id,
        restoreData: {
          formValues: updatedTempData.formValues,
          selectedEmployees: updatedTempData.selectedEmployees,
          selectedHouseholds: updatedTempData.selectedHouseholds,
          selectedLandPrices: updatedTempData.selectedLandPrices
        }
      };
      localStorage.setItem("reopenModal", JSON.stringify(reopenData));

      message.success("Đã chọn/cập nhật hộ dân thành công!");
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
        selectedLandPrices: existingTempData.selectedLandPrices || []
      }
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
    { title: "Mã hộ dân", dataIndex: "maHoDan", key: "maHoDan" },
    { title: "Chủ hộ", dataIndex: "hoTenChuSuDung", key: "hoTenChuSuDung" },
    { title: "Địa chỉ", dataIndex: "diaChiThuongTru", key: "diaChiThuongTru" },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/detail/household/${record.id}`)}>
          Xem chi tiết
        </Button>
      )
    }
  ];

  return (
    <Card
      title={`Danh sách Hộ dân trong dự án (${mode === "view" ? "Xem" : mode === "add" ? "Thêm" : "Sửa"})`}
      style={{ margin: 24 }}
      extra={(mode === "add" || mode === "edit") && (
        <div style={{ fontSize: 14, color: "#666" }}>
          Đã chọn: {tempSelectedRowKeys.length} hộ dân
        </div>
      )}
    >
      <Spin spinning={loading}>
        <Input
          placeholder="Tìm theo tên, mã hộ dân, SĐT"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 300, height: 40, marginBottom: 16 }}
        />

        <Table
          dataSource={households}
          rowKey="id"
          size="small"
          rowSelection={(mode === "add" || mode === "edit") ? {
            selectedRowKeys,
            onChange: (newSelectedKeys) => {
              setSelectedRowKeys(newSelectedKeys);

              const mergedKeys = Array.from(new Set([
                ...tempSelectedRowKeys.filter(k => !households.some(h => h.id === k)),
                ...newSelectedKeys
              ]));
              setTempSelectedRowKeys(mergedKeys);
            },
            type: "checkbox",
            preserveSelectedRowKeys: true
          } : undefined}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchData(page, pageSize, searchKeyword)
          }}
          columns={columns}
        />

        {(mode === "add" || mode === "edit") && (
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button style={{ marginRight: 8 }} onClick={handleCancel}>Hủy</Button>
            <Button type="primary" onClick={handleConfirm} disabled={!tempSelectedRowKeys.length}>
              {mode === "add" ? "Xác nhận chọn" : "Cập nhật"} ({tempSelectedRowKeys.length} hộ dân)
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
