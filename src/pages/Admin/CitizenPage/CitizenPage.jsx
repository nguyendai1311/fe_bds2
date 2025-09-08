import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Upload,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  message,
  Tooltip,
  Spin,
  Table,
  Divider,
  Checkbox,
  InputNumber,
  Dropdown,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  UploadOutlined,
  DownOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import * as CitizenService from "../../../services/CitizenService";
import { uploadFile } from "../../../services/FileService";
import { FiMoreVertical } from "react-icons/fi"; // hoặc FiMoreHorizontal

import {
  PageHeader,
  FilterContainer,
  HeaderActions,
  CenteredAction,
} from "./style";
import { renderFileList } from "../../../utils/fileRender";
import { normalizeDate, toDayjsOrNull, safeProcessNestedObject, parseDayjsToDate } from "../../../utils/date"
import dayjs from "dayjs";

export default function CitizenPage() {
  const [citizens, setCitizens] = useState([]);
  const [filteredCitizens, setFilteredCitizens] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  const [editingCitizen, setEditingCitizen] = useState(null);
  const [viewingCitizen, setViewingCitizen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);

  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem("user"));

  // Hàm fetch data chính
  const fetchCitizens = async ({ page = 1, limit = 8, search = "" } = {}) => {
    setLoading(true);
    try {
      const res = await CitizenService.getAll(user?.access_token, {
        page,
        limit,
        search,
      });

      const data = res?.data || [];

      const list = data.map((cit, index) => ({
        key: cit.id || index.toString(),
        id: cit.id,
        household_id: cit.household_id || "",
        owner_name: cit.owner_name || "",
        contact_phone: cit.contact_phone || "",
        permanent_address: cit.permanent_address || "",
        clearance_address: cit.clearance_address || "",
        land_plot_number: cit.land_plot_number || "",
        map_sheet_number: cit.map_sheet_number || "",
        phuong: cit.phuong || "",
        district: cit.district || "",
        land_withdrawal_notice_no: cit.land_withdrawal_notice_no
          ? { ...cit.land_withdrawal_notice_no, ngay: normalizeDate(cit.land_withdrawal_notice_no.ngay) }
          : null,
        land_withdrawal_decision_no: cit.land_withdrawal_decision_no
          ? { ...cit.land_withdrawal_decision_no, ngay: normalizeDate(cit.land_withdrawal_decision_no.ngay) }
          : null,
        compensation_plan_no: cit.compensation_plan_no
          ? { ...cit.compensation_plan_no, ngay: normalizeDate(cit.compensation_plan_no.ngay) }
          : null,
        compensation_received: cit.compensation_received
          ? { ...cit.compensation_received, ngay: normalizeDate(cit.compensation_received.ngay) }
          : { xacNhan: false, ngay: null, dinhKem: [] },
        site_handover: cit.site_handover
          ? { ...cit.site_handover, ngay: normalizeDate(cit.site_handover.ngay) }
          : { xacNhan: false, ngay: null, dinhKem: [] },
        total_compensation_amount: cit.tongSoTienBoiThuongHoTro || "",
        amount_in_words: cit.bangChu || "",
        createdAt: normalizeDate(cit.createdAt),
        updatedAt: normalizeDate(cit.updatedAt),
      }));
      setTotal(res.total);
      setCitizens(list);
      setFilteredCitizens(list);

    } catch (err) {
      console.error("Error fetching citizens:", err);
      message.error("Không thể tải danh sách dân cư");
    } finally {
      setLoading(false);
    }
  };


  // Load data khi component mount
  useEffect(() => {
    fetchCitizens({ page: currentPage, limit: pageSize });
  }, [currentPage, pageSize]);



  // Filter theo keyword
  useEffect(() => {
    const keyword = searchKeyword.toLowerCase();
    const results = citizens.filter(
      (c) =>
        c.owner_name?.toLowerCase().includes(keyword) ||
        c.household_id?.toLowerCase().includes(keyword) ||
        c.contact_phone?.toLowerCase().includes(keyword)
    );
    setFilteredCitizens(results);
  }, [searchKeyword, citizens]);

  // Hàm convert file list
  const convertFileList = (files) => {
    if (!files) return [];

    // Nếu BE trả về array
    if (Array.isArray(files)) {
      return files.map((f, idx) => ({
        uid: idx.toString(),
        name: f.originalname || f.name || f.path?.split("/").pop(),
        status: "done",
        url: f.url || f.path || "",
        size: f.size || 0,
        type: f.mimetype || "application/octet-stream",
      }));
    }

    // Nếu BE trả về object đơn
    if (typeof files === "object" && files.url) {
      return [
        {
          uid: "0",
          name: files.originalname || files.name || files.path?.split("/").pop(),
          status: "done",
          url: files.url || files.path || "",
          size: files.size || 0,
          type: files.mimetype || "application/octet-stream",
        },
      ];
    }

    // Nếu BE trả về string URL
    if (typeof files === "string") {
      return [
        {
          uid: "0",
          name: files.split("/").pop(),
          status: "done",
          url: files,
        },
      ];
    }

    return [];
  };


  const renderAttachment = (dinhKem) => {
    if (!dinhKem) return null;

    // Nếu BE trả về object
    if (typeof dinhKem === "object" && dinhKem.url) {
      return (
        <a href={dinhKem.url} target="_blank" rel="noreferrer">
          📎 {dinhKem.originalname || "Xem file"}
        </a>
      );
    }

    // Nếu BE trả về mảng object
    if (Array.isArray(dinhKem)) {
      return dinhKem.map((f, idx) => (
        <div key={idx}>
          <a href={f.url || f} target="_blank" rel="noreferrer">
            📎 {f.originalname || f.name || `File ${idx + 1}`}
          </a>
        </div>
      ));
    }

    // Nếu chỉ là string URL
    if (typeof dinhKem === "string") {
      return (
        <a href={dinhKem} target="_blank" rel="noreferrer">
          📎 Xem file
        </a>
      );
    }

    return null;
  };


  const handleDelete = (record) => {
    setEditingCitizen(record);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingCitizen?.key) {
      message.error("ID citizen không hợp lệ!");
      setIsDeleteModalVisible(false);
      return;
    }
    try {
      await CitizenService.remove(editingCitizen.key, user?.access_token);
      message.success(`Đã xóa dân cư: ${editingCitizen.owner_name}`);

      // Reload data sau khi xóa
      await fetchCitizens();
      setIsDeleteModalVisible(false);
      setEditingCitizen(null);
    } catch (err) {
      console.error("Error deleting citizen:", err);
      message.error(err?.message || "Xóa thất bại!");
    }
  };

  // ✅ Hàm Add + Edit citizen gộp chung
  const handleAddEditCitizen = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Helper upload files với error handling tốt hơn
      const processFiles = async (fileList, fieldName) => {
        if (!fileList || !Array.isArray(fileList)) return [];

        const uploadedFiles = [];
        const uploadPromises = [];

        for (const f of fileList) {
          if (f.url) {
            // File đã có sẵn trong DB - giữ nguyên
            uploadedFiles.push(f.url);
          } else if (f.originFileObj) {
            // File mới cần upload
            const uploadPromise = (async () => {
              try {
                const formData = new FormData();
                formData.append(fieldName, f.originFileObj);
                const res = await uploadFile(formData, user?.access_token);

                if (res?.data) {
                  return res.data; // {path, name}
                } else if (res?.files?.[0]) {
                  return res.files[0];
                } else {
                  throw new Error(`Invalid upload response for ${f.name}`);
                }
              } catch (uploadError) {
                console.error(`Upload error for ${f.name}:`, uploadError);
                message.warning(`Không thể upload file ${f.name}: ${uploadError.message}`);
                return null; // Trả về null để filter sau
              }
            })();
            uploadPromises.push(uploadPromise);
          }
        }

        // Chờ tất cả uploads hoàn thành
        if (uploadPromises.length > 0) {
          const uploadResults = await Promise.all(uploadPromises);
          uploadedFiles.push(...uploadResults.filter(result => result !== null));
        }

        return uploadedFiles;
      };

      // Helper xử lý object có ngày + file với validation
      const normalizeNestedObject = async (obj, fieldName, hasXacNhan = false) => {
        if (!obj) {
          return hasXacNhan
            ? { xacNhan: false, ngay: null, dinhKem: [] }
            : null; // giữ null thay vì tự tạo object rỗng
        }


        // Validate required fields
        if (!hasXacNhan && !obj.so) {
          console.warn(`Warning: ${fieldName} missing 'so' field`);
        }

        const result = {
          ...(hasXacNhan
            ? { xacNhan: Boolean(obj.xacNhan) }
            : { so: obj.so || "" }),
          ngay: obj.ngay ? parseDayjsToDate(obj.ngay) : null,
          dinhKem: await processFiles(obj.dinhKem, fieldName),
        };

        console.log(`Processed ${fieldName}:`, result);
        return result;
      };

      // Validate form data trước khi process
      const requiredFields = ['household_id', 'owner_name'];
      for (const field of requiredFields) {
        if (!values[field]) {
          message.error(`Trường ${field} là bắt buộc`);
          return;
        }
      }

      // Chuẩn hóa dữ liệu để gửi API
      console.log('Processing form values:', values);

      const normalizedValues = {
        ...values,
        land_withdrawal_notice_no: await normalizeNestedObject(
          values.land_withdrawal_notice_no,
          "land_withdrawal_notice_no"
        ),
        land_withdrawal_decision_no: await normalizeNestedObject(
          values.land_withdrawal_decision_no,
          "land_withdrawal_decision_no"
        ),
        compensation_plan_no: await normalizeNestedObject(
          values.compensation_plan_no,
          "compensation_plan_no"
        ),
        compensation_received: await normalizeNestedObject(
          values.compensation_received,
          "compensation_received",
          true
        ),
        site_handover: await normalizeNestedObject(
          values.site_handover,
          "site_handover",
          true
        ),
      };

      console.log('Normalized values:', normalizedValues);

      let savedCitizen;

      if (editingCitizen) {
        // Update existing citizen
        if (!editingCitizen.id) {
          message.error("ID citizen không hợp lệ để cập nhật!");
          return;
        }

        const payload = {
          ...normalizedValues,
          id: editingCitizen.id,
          updatedAt: new Date().toISOString(),
        };

        console.log("Updating citizen with payload:", payload);

        try {
          savedCitizen = await CitizenService.update(
            editingCitizen.id,
            payload,
            user?.access_token
          );
          message.success("Cập nhật dân cư thành công!");
        } catch (updateError) {
          console.error("Update API error:", updateError);
          throw new Error(`Cập nhật thất bại: ${updateError.message || updateError}`);
        }
      } else {
        // Create new citizen
        console.log("Creating new citizen with data:", normalizedValues);

        try {
          savedCitizen = await CitizenService.create(
            normalizedValues,
            user?.access_token
          );
          message.success("Thêm dân cư thành công!");
        } catch (createError) {
          console.error("Create API error:", createError);
          throw new Error(`Tạo mới thất bại: ${createError.message || createError}`);
        }
      }

      console.log("Saved citizen response:", savedCitizen);

      // Reset form và đóng modal
      form.resetFields();
      setEditingCitizen(null);
      setIsAddEditModalVisible(false);

      // Reload data với current page
      await fetchCitizens({
        page: currentPage,
        limit: pageSize,
        search: searchKeyword
      });

    } catch (validationError) {
      // Form validation errors
      if (validationError.errorFields) {
        console.error("Form validation errors:", validationError.errorFields);
        message.error("Vui lòng kiểm tra lại thông tin nhập vào");
        return;
      }

      // API or processing errors
      console.error("Error in handleAddEditCitizen:", validationError);
      const errorMessage = validationError?.message ||
        validationError?.response?.data?.message ||
        "Đã xảy ra lỗi không xác định";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };


  // Hàm xem chi tiết
  const handleViewCitizen = async (record) => {
    try {
      setLoading(true);
      const res = await CitizenService.getById(record.key, user?.access_token);
      const citizenData = res?.data;

      if (citizenData) {
        const citizen = {
          key: citizenData.id,
          id: citizenData.id,
          ...citizenData,
          land_withdrawal_notice_no: citizenData.land_withdrawal_notice_no
            ? {
              ...citizenData.land_withdrawal_notice_no,
              ngay: normalizeDate(citizenData.land_withdrawal_notice_no.ngay),
            }
            : null,
          land_withdrawal_decision_no: citizenData.land_withdrawal_decision_no
            ? {
              ...citizenData.land_withdrawal_decision_no,
              ngay: normalizeDate(citizenData.land_withdrawal_decision_no.ngay),
            }
            : null,
          compensation_plan_no: citizenData.compensation_plan_no
            ? {
              ...citizenData.compensation_plan_no,
              ngay: normalizeDate(citizenData.compensation_plan_no.ngay),
            }
            : null,
          compensation_received: citizenData.compensation_received
            ? {
              ...citizenData.compensation_received,
              ngay: normalizeDate(citizenData.compensation_received.ngay),
            }
            : { xacNhan: false, ngay: null, dinhKem: [] },
          site_handover: citizenData.site_handover
            ? {
              ...citizenData.site_handover,
              ngay: normalizeDate(citizenData.site_handover.ngay),
            }
            : { xacNhan: false, ngay: null, dinhKem: [] },
        };

        setViewingCitizen(citizen);
        setIsViewModalVisible(true);
      }
    } catch (err) {
      console.error("Error loading citizen details:", err);
      message.error("Không thể tải dữ liệu chi tiết");
    } finally {
      setLoading(false);
    }
  };

  // Hàm edit citizen - Enhanced version with better null handling
  const handleEditCitizen = async (record) => {
    try {
      setLoading(true);
      const res = await CitizenService.getById(record.key, user?.access_token);
      const citizenData = res?.data;

      console.log("📊 Raw citizen data from API:", citizenData);

      if (citizenData) {
        // Helper function xử lý nested object an toàn
        const safeProcessNestedObject = (obj, fieldName, hasXacNhan = false) => {
          console.log(`🔍 Processing ${fieldName}:`, obj);

          if (!obj || obj === null) {
            console.log(`⚠️ ${fieldName} is null/undefined, returning default`);
            return hasXacNhan
              ? { xacNhan: false, ngay: null, dinhKem: [] }
              : { so: "", ngay: null, dinhKem: [] };
          }

          return {
            ...(hasXacNhan ? { xacNhan: Boolean(obj.xacNhan) } : { so: obj.so || "" }),
            ngay: toDayjsOrNull(obj.ngay), // ✅ convert 1 lần duy nhất
            dinhKem: convertFileList(obj.dinhKem) || [],
          };
        };

        const converted = {
          ...citizenData,
          land_withdrawal_notice_no: safeProcessNestedObject(
            citizenData.land_withdrawal_notice_no,
            "land_withdrawal_notice_no"
          ),
          land_withdrawal_decision_no: safeProcessNestedObject(
            citizenData.land_withdrawal_decision_no,
            "land_withdrawal_decision_no"
          ),
          compensation_plan_no: safeProcessNestedObject(
            citizenData.compensation_plan_no,
            "compensation_plan_no"
          ),
          compensation_received: safeProcessNestedObject(
            citizenData.compensation_received,
            "compensation_received",
            true
          ),
          site_handover: safeProcessNestedObject(
            citizenData.site_handover,
            "site_handover",
            true
          ),
          total_compensation_amount: citizenData.total_compensation_amount
            ? Number(citizenData.total_compensation_amount)
            : undefined,
          amount_in_words: citizenData.amount_in_words || "",
        };

        console.log("✅ Final converted data:", converted);

        // Lưu editingCitizen để biết đang edit record nào
        setEditingCitizen({
          ...citizenData,
          key: citizenData.id,
          id: citizenData.id,
        });

        // ✅ set luôn converted vào form, đã chuẩn hóa toàn bộ
        form.setFieldsValue(converted);

        setIsAddEditModalVisible(true);
      }
    } catch (err) {
      console.error("❌ Error loading citizen for edit:", err);
      message.error("Không thể tải dữ liệu để sửa");
    } finally {
      setLoading(false);
    }
  };


  const columns = [
    { title: "Mã hộ dân", dataIndex: "household_id" },
    { title: "Họ tên", dataIndex: "owner_name" },
    { title: "SĐT", dataIndex: "contact_phone" },
    { title: "Địa chỉ", dataIndex: "permanent_address" },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: "Xem chi tiết",
            icon: <EyeOutlined />,
            onClick: () => handleViewCitizen(record),
          },
          {
            key: "edit",
            label: "Sửa",
            icon: <EditOutlined />,
            onClick: () => handleEditCitizen(record),
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
        <h2 className="text-xl font-semibold mb-4">Quản lý dân cư</h2>
      </div>
      <FilterContainer className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm theo tên, mã hộ dân, SĐT"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onPressEnter={() => fetchCitizens({ page: 1, limit: pageSize, search: searchKeyword })}
          onBlur={() => fetchCitizens({ page: 1, limit: pageSize, search: searchKeyword })}
          style={{ width: 300, height: 40 }}
        />


        <HeaderActions>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCitizen(null);
              form.resetFields();
              setIsAddEditModalVisible(true);
            }}
          >
            Thêm dân cư
          </Button>
        </HeaderActions>
      </FilterContainer>

      <Spin spinning={loading}>
        <div className="bg-white rounded-2xl shadow p-4 ">
          <Table
            columns={columns}
            dataSource={filteredCitizens}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
                fetchCitizens({ page, limit: size, search: searchKeyword });
              },
            }}
            size="small"
            bordered
            rowKey="id"
            className="text-sm [&_.ant-table]:text-sm [&_.ant-table-cell]:px-3 [&_.ant-table-cell]:py-2"
          />
        </div>
      </Spin>



      {/* Modal xóa */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setEditingCitizen(null);
        }}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa hộ dân <strong>{editingCitizen?.owner_name}</strong>?</p>
      </Modal>

      {/* Modal thêm/sửa */}
      <Modal
        title={editingCitizen ? "Sửa thông tin hộ dân" : "Thêm hộ dân"}
        open={isAddEditModalVisible}
        onOk={handleAddEditCitizen}
        onCancel={() => {
          setIsAddEditModalVisible(false);
          form.resetFields();
          setEditingCitizen(null);
        }}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        width={1400}
        destroyOnClose
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          <Divider orientation="left">Thông tin hộ dân</Divider>

          {/* --- Thông tin cơ bản --- */}
          {[
            { label: "Mã hộ dân", name: "household_id" },
            { label: "Họ và tên chủ sử dụng", name: "owner_name" },
            { label: "Địa chỉ thường trú", name: "permanent_address" },
            { label: "Số điện thoại liên lạc", name: "contact_phone" },
            { label: "Địa chỉ giải tỏa", name: "clearance_address" },
          ].map((field) => (
            <Row gutter={16} key={field.name} style={{ marginBottom: 16 }} align="middle">
              <Col span={4}>
                <label style={{ fontWeight: 500 }}>{field.label}:</label>
              </Col>
              <Col span={8}>
                <Form.Item name={field.name} style={{ marginBottom: 0 }}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          ))}

          {/* --- Số thửa, tờ theo BĐĐC 2002 --- */}
          <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
            <Col span={4}><label>Số thửa, tờ theo BĐĐC 2002:</label></Col>
            <Col span={4}><Form.Item name="land_plot_number"><Input placeholder="Số thửa" /></Form.Item></Col>
            <Col span={4}><Form.Item name="map_sheet_number"><Input placeholder="Số tờ" /></Form.Item></Col>
            <Col span={6}><Form.Item name="phuong"><Input placeholder="Phường" /></Form.Item></Col>
            <Col span={6}><Form.Item name="district"><Input placeholder="Quận" /></Form.Item></Col>
          </Row>

          {/* --- Các object nested --- */}
          {[
            { label: "Thông báo thu hồi đất", name: "land_withdrawal_notice_no" },
            { label: "Quyết định phê duyệt", name: "land_withdrawal_decision_no" },
            { label: "Phương án BT, HT, TĐC", name: "compensation_plan_no" },
            { label: "Đã nhận tiền bồi thường, hỗ trợ", name: "compensation_received", isCheckbox: true },
            { label: "Đã bàn giao mặt bằng", name: "site_handover", isCheckbox: true },
          ].map((field) => (
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }} key={field.name}>
              <Col span={4}><label>{field.label}:</label></Col>

              {/* Số / checkbox */}
              <Col span={2}>
                <Form.Item
                  name={field.isCheckbox ? [field.name, "xacNhan"] : [field.name, "so"]}
                  valuePropName={field.isCheckbox ? "checked" : undefined}
                  style={{ marginBottom: 0 }}
                >
                  {field.isCheckbox ? <Checkbox /> : <Input placeholder="Số" />}
                </Form.Item>
              </Col>

              {/* Ngày */}
              <Col span={8}>
                <Form.Item
                  name={[field.name, "ngay"]}
                  style={{ marginBottom: 0 }}
                >
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày" />
                </Form.Item>
              </Col>

              {/* Upload */}
              <Col span={8}>
                <Form.Item
                  name={[field.name, "dinhKem"]}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => e?.fileList || []}
                  style={{ marginBottom: 0 }}
                >
                  <Upload
                    listType="text"
                    beforeUpload={() => false} // Prevent auto upload
                    multiple
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          ))}

          {/* --- Tổng số tiền bồi thường --- */}
          <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
            <Col span={4}><label>Tổng số tiền bồi thường hỗ trợ:</label></Col>
            <Col span={6}>
              <Form.Item name="total_compensation_amount">
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/,/g, "")}
                  placeholder="Nhập số tiền"
                  addonAfter="đồng"
                  controls={false}
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="amount_in_words">
                <Input placeholder="Bằng chữ" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal xem chi tiết */}
      <Modal
        title="Chi tiết dân cư"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingCitizen(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsViewModalVisible(false);
            setViewingCitizen(null);
          }}>
            Đóng
          </Button>
        ]}
        width={1200}
      >
        {viewingCitizen && (
          <div>
            {/* --- Thông tin cơ bản --- */}
            <Divider orientation="left">Thông tin cơ bản</Divider>

            {[
              { label: "Mã hộ dân", value: viewingCitizen.household_id },
              { label: "Họ tên", value: viewingCitizen.owner_name },
              { label: "SĐT", value: viewingCitizen.contact_phone },
              { label: "Địa chỉ", value: viewingCitizen.permanent_address },
            ].map((field, index) => (
              <Row key={index} style={{ marginBottom: 12 }} align="middle">
                <Col span={4}>
                  <label style={{ fontWeight: 500 }}>{field.label}:</label>
                </Col>
                <Col span={20}>
                  <span>{field.value || "Chưa có thông tin"}</span>
                </Col>
              </Row>
            ))}

            {/* --- Thông tin đất đai --- */}
            <Divider orientation="left">Thông tin đất đai</Divider>
            <Row style={{ marginBottom: 12 }} align="middle">
              <Col span={4}><label style={{ fontWeight: 500 }}>Số thửa, tờ theo BĐĐC 2002:</label></Col>
              <Col span={4}><span><b>Số thửa:</b> {viewingCitizen.land_plot_number || "N/A"}</span></Col>
              <Col span={4}><span><b>Số tờ:</b> {viewingCitizen.map_sheet_number || "N/A"}</span></Col>
              <Col span={6}><span><b>Phường:</b> {viewingCitizen.phuong || "N/A"}</span></Col>
              <Col span={6}><span><b>Quận:</b> {viewingCitizen.district || "N/A"}</span></Col>
            </Row>


            {/* --- Thông báo thu hồi đất --- */}
            <Divider orientation="left">Thông báo thu hồi đất</Divider>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={4}><label style={{ fontWeight: 500 }}>Thông báo thu hồi đất:</label></Col>
              <Col span={4}><span><b>Số:</b> {viewingCitizen?.land_withdrawal_notice_no?.so || "N/A"}</span></Col>
              <Col span={8}>
                <span><b>Ngày:</b> {viewingCitizen?.land_withdrawal_notice_no?.ngay || "N/A"}</span>
              </Col>
              <Col span={8}>
                {renderAttachment(viewingCitizen?.land_withdrawal_notice_no?.dinhKem)}
              </Col>

            </Row>

            {/* --- Quyết định phê duyệt --- */}
            <Divider orientation="left">Quyết định phê duyệt</Divider>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={4}><label style={{ fontWeight: 500 }}>Quyết định phê duyệt:</label></Col>
              <Col span={4}><span><b>Số:</b> {viewingCitizen?.land_withdrawal_decision_no?.so || "N/A"}</span></Col>
              <Col span={8}>
                <span><b>Ngày:</b> {viewingCitizen?.land_withdrawal_decision_no?.ngay || "N/A"}</span>
              </Col>
              <Col span={8}>
                {renderAttachment(viewingCitizen?.land_withdrawal_decision_no?.dinhKem)}
              </Col>
            </Row>

            {/* --- Phương án BT, HT, TĐC --- */}
            <Divider orientation="left">Phương án BT, HT, TĐC</Divider>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={4}><label style={{ fontWeight: 500 }}>Phương án BT, HT, TĐC:</label></Col>
              <Col span={4}><span><b>Số:</b> {viewingCitizen?.compensation_plan_no?.so || "N/A"}</span></Col>
              <Col span={8}>
                <span><b>Ngày:</b> {viewingCitizen?.compensation_plan_no?.ngay || "N/A"}</span>
              </Col>
              <Col span={8}>
                {renderAttachment(viewingCitizen?.compensation_plan_no?.dinhKem)}
              </Col>
            </Row>

            {/* --- Thông tin bồi thường --- */}
            {(viewingCitizen.total_compensation_amount || viewingCitizen.amount_in_words) && (
              <>
                <Divider orientation="left">Thông tin bồi thường</Divider>
                <Row style={{ marginBottom: 12 }}>
                  <Col span={4}><label style={{ fontWeight: 500 }}>Tổng số tiền:</label></Col>
                  <Col span={10}>
                    <span>
                      {viewingCitizen.total_compensation_amount ? `${viewingCitizen.total_compensation_amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " đồng" : "0 đồng"}
                    </span>
                  </Col>
                  <Col span={10}><span><b>Bằng chữ:</b> {viewingCitizen.amount_in_words || "Chưa có"}</span></Col>
                </Row>
              </>
            )}

            {/* --- Trạng thái thực hiện --- */}
            <Divider orientation="left">Trạng thái thực hiện</Divider>
            {[
              { label: "Đã nhận tiền bồi thường, hỗ trợ", data: viewingCitizen?.compensation_received },
              { label: "Đã bàn giao mặt bằng", data: viewingCitizen?.site_handover }
            ].map((status, index) => (
              <Row key={index} gutter={16} style={{ marginBottom: 12 }}>
                <Col span={4}><label style={{ fontWeight: 500 }}>{status.label}:</label></Col>
                <Col span={4}>
                  <span style={{ color: status.data?.xacNhan ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
                    {status.data?.xacNhan ? "✓ Đã thực hiện" : "✗ Chưa thực hiện"}
                  </span>
                </Col>
                <Col span={8}>
                  {status.data?.ngay && (
                    <span><b>Ngày:</b> {status.data.ngay}</span>
                  )}
                </Col>
                <Col span={8}>
                  {renderAttachment(status.data?.dinhKem)}
                </Col>
              </Row>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}