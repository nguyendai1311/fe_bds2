import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spin, Button, Table, message, Input, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedLandPrices } from "../../../redux/slices/projectSlice";
import * as LandPriceService from "../../../services/LandPriceService";

export default function LandPriceDetailPage() {
  const { id, mode } = useParams(); // mode = view | add | edit
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [landPrices, setLandPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 8 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const selectedLandPrices = useSelector(state => state.project?.selectedLandPrices || []);

  // ----- Fetch data -----
  const fetchLandPricesData = async (page = 1, pageSize = 8, search = "") => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      let list = [];

      if (mode === "add" || mode === "edit") {
        const res = await LandPriceService.getAll(user?.access_token);
        list = Array.isArray(res?.data) ? res.data : [];

        if (search) {
          const searchLower = search.toLowerCase();
          list = list.filter(lp =>
            lp.land_type_name?.toLowerCase().includes(searchLower) ||
            lp.land_price_id?.toLowerCase().includes(searchLower)
          );
        }

        const totalCount = list.length;
        const pagedList = list.slice((page - 1) * pageSize, page * pageSize);

        setLandPrices(pagedList);
        setPagination({ total: totalCount, page, pageSize });
      }

      if (mode === "view" && id) {
        const res = await LandPriceService.getLandByProjectId(id, page, pageSize, search, user?.access_token);
        if (res?.success) {
          setLandPrices(res.data || []);
          setPagination({ total: res.total, page: res.page, pageSize: res.limit });
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
    fetchLandPricesData(1, pagination.pageSize);
  }, [id, mode]);

  // ----- Init / sync selectedRowKeys từ Redux hoặc localStorage -----
  useEffect(() => {
    let initialSelectedIds = [];

    const tempFormData = localStorage.getItem("tempFormData");
    if (tempFormData) {
      try {
        const tempData = JSON.parse(tempFormData);
        if (tempData.selectedLandPrices) {
          let tempSelected = tempData.selectedLandPrices;
          if (typeof tempSelected === "string") tempSelected = JSON.parse(tempSelected);
          if (Array.isArray(tempSelected)) {
            if (typeof tempSelected[0] === "string") initialSelectedIds = tempSelected;
            else if (typeof tempSelected[0] === "object" && tempSelected[0]?.id)
              initialSelectedIds = tempSelected.map(l => l.id);
          }
        }
      } catch (e) {
        console.error("Error parsing tempFormData:", e);
      }
    }

    if (initialSelectedIds.length === 0 && selectedLandPrices.length > 0) {
      if (typeof selectedLandPrices[0] === "string") initialSelectedIds = selectedLandPrices;
      else if (typeof selectedLandPrices[0] === "object" && selectedLandPrices[0]?.id)
        initialSelectedIds = selectedLandPrices.map(l => l.id);
    }

    setSelectedRowKeys(initialSelectedIds);
  }, [selectedLandPrices, mode]);

  // ----- Handle row selection (merge selections giữa các page/search) -----
  const handleRowSelectChange = (newSelectedKeys) => {
    setSelectedRowKeys(prev => {
      const merged = Array.from(new Set([...prev.filter(k => landPrices.some(lp => lp.id === k)), ...newSelectedKeys]));
      return merged;
    });
  };

  // ----- Confirm selection -----
  const handleConfirm = () => {
    try {
      const selectedLandPriceDetails = selectedRowKeys
        .map(key => landPrices.find(lp => lp.id === key) || { id: key })
        .filter(Boolean);

      dispatch(setSelectedLandPrices(selectedLandPriceDetails));

      const existingTempData = JSON.parse(localStorage.getItem("tempFormData") || "{}");
      const updatedTempData = {
        ...existingTempData,
        selectedLandPrices: selectedLandPriceDetails,
        timestamp: Date.now(),
        lastModified: "landPrices",
      };
      localStorage.setItem("tempFormData", JSON.stringify(updatedTempData));

      const reopenData = {
        type: id === "new" ? "add" : "edit",
        projectId: id || "new",
        restoreData: {
          ...existingTempData,
          selectedLandPrices: selectedLandPriceDetails,
        },
      };
      localStorage.setItem("reopenModal", JSON.stringify(reopenData));

      message.success(
        mode === "add"
          ? `Đã chọn ${selectedLandPriceDetails.length} bảng giá đất cho dự án mới!`
          : `Đã cập nhật ${selectedLandPriceDetails.length} bảng giá đất cho dự án!`
      );

      navigate(-1);
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra!");
    }
  };

  // ----- Cancel -----
  const handleCancel = () => {
    const existingTempData = JSON.parse(localStorage.getItem("tempFormData") || "{}");
    const reopenData = {
      type: id === "new" ? "add" : "edit",
      projectId: id || "new",
      restoreData: {
        formValues: existingTempData.formValues || {},
        selectedEmployees: existingTempData.selectedEmployees || [],
        selectedHouseholds: existingTempData.selectedHouseholds || [],
        selectedLandPrices: existingTempData.selectedLandPrices || selectedLandPrices,
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
    fetchLandPricesData(1, pagination.pageSize, searchKeyword);
  };

  const columns = [
    { title: "Mã đất", dataIndex: "land_price_id", key: "land_price_id" },
    { title: "Tên loại đất/vị trí", dataIndex: "land_type_name", key: "land_type_name" },
    { title: "Đơn vị tính", dataIndex: "unit", key: "unit" },
    { title: "Đơn giá theo QĐ", dataIndex: "unit_price_qd", key: "unit_price_qd" },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button type="link" onClick={() => navigate(`/detail/land/${record.id}`)}>
            Xem chi tiết
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      title={`Danh sách Bảng giá đất (${mode === "view" ? "Xem" : mode === "add" ? "Thêm" : "Sửa"})`}
      style={{ margin: 24 }}
      extra={(mode === "add" || mode === "edit") && (
        <div style={{ fontSize: "14px", color: "#666" }}>
          Đã chọn: {selectedRowKeys.length} bảng giá
        </div>
      )}
    >
      <Spin spinning={loading}>
        {(mode === "add" || mode === "edit") && (
          <Input
            placeholder="Tìm theo mã đất hoặc tên loại đất"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300, height: 40, marginBottom: 16 }}
          />
        )}

        <Table
          dataSource={landPrices}
          rowKey="id"
          rowSelection={
            mode === "add" || mode === "edit"
              ? {
                  selectedRowKeys,
                  onChange: handleRowSelectChange,
                  type: "checkbox",
                  preserveSelectedRowKeys: true,
                }
              : undefined
          }
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => fetchLandPricesData(page, pageSize, searchKeyword),
            showTotal: total => `Tổng ${total} bảng giá`,
          }}
          columns={columns}
        />

        {(mode === "add" || mode === "edit") && (
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button style={{ marginRight: 8 }} onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="primary" onClick={handleConfirm} disabled={!selectedRowKeys.length}>
              {mode === "add" ? "Xác nhận chọn" : "Cập nhật"} ({selectedRowKeys.length} bảng giá)
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
