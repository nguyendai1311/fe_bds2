import { useState, useEffect } from "react";
import {
  Table,
  Input,
  message,
  Spin,
  Button,
  Modal,
  Form,
  Col,
  Row,
  Divider,
  Space,
  Dropdown,
} from "antd";
import { DeleteOutlined, PlusOutlined, EyeOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector, useDispatch } from "react-redux";

import * as ProjectService from "../../../services/ProjectService";
import {
  setSelectedHouseholds,
  setSelectedEmployees,
  clearHouseholds,
  clearEmployees,
  setSelectedLandPrices,
  clearLandPrices
} from "../../../redux/slices/projectSlice";

import { FilterContainer, HeaderActions } from "./style";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "../../../services/FileService";
import { FiMoreVertical } from "react-icons/fi";
import ViewModal from "../../../components/ModalComponent/ViewModal";
import EditModal from "../../../components/ModalComponent/EditModal";

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewProject, setViewProject] = useState(null);

  // Lấy dữ liệu từ Redux
  const dispatch = useDispatch();
  const selectedHouseholds = useSelector(state => state.project?.selectedHouseholds || []);
  const selectedEmployees = useSelector(state => state.project?.selectedEmployees || []);
  const selectedLandPrices = useSelector(state => state.project?.selectedLandPrices || []);

  const [form] = Form.useForm();
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // ================== Fetch projects ==================
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await ProjectService.getAllProjects(user?.access_token);

      const list =
        res?.map((proj, index) => ({
          key: proj.id || index.toString(),
          id: proj.id,
          project_code: proj.project_code || "",
          name: proj.project_name || proj.name || "",
          investor: proj.investor || "",
          approval_decision_no: proj.approval_decision_no || "",
          approval_date: proj.approval_date
            ? dayjs(proj.approval_date).format("YYYY-MM-DD")
            : "",
          approval_decision_file: proj.approval_decision_file || "",
          map_no: proj.map_no || "",
          map_approval_date: proj.map_approval_date
            ? dayjs(proj.map_approval_date).format("YYYY-MM-DD")
            : "",
          map_file: proj.map_file || "",
          land_price_decision_no: proj.land_price_decision_no || "",
          land_price_approval_date: proj.land_price_approval_date
            ? dayjs(proj.land_price_approval_date).format("YYYY-MM-DD")
            : "",
          land_price_file: proj.land_price_file || "",
          compensation_plan_decision_no: proj.compensation_plan_decision_no || "",
          compensation_plan_approval_date: proj.compensation_plan_approval_date
            ? dayjs(proj.compensation_plan_approval_date).format("YYYY-MM-DD")
            : "",
          compensation_plan_file: proj.compensation_plan_file || "",
          compensation_plan_no: proj.compensation_plan_no || "",
          plan_approval_date: proj.plan_approval_date
            ? dayjs(proj.plan_approval_date).format("YYYY-MM-DD")
            : "",
          plan_file: proj.plan_file || "",
          site_clearance_start_date: proj.site_clearance_start_date
            ? dayjs(proj.site_clearance_start_date).format("YYYY-MM-DD")
            : "",
          project_status: proj.project_status || "",
          project_objectives: proj.project_objectives || "",
          project_scale: proj.project_scale || "",
          project_location: proj.project_location || "",
          construction_cost: proj.construction_cost || 0,
          project_management_cost: proj.project_management_cost || 0,
          consulting_cost: proj.consulting_cost || 0,
          other_costs: proj.other_costs || 0,
          contingency_cost: proj.contingency_cost || 0,
          land_clearance_cost: proj.land_clearance_cost || 0,
          start_point: proj.start_point || "",
          end_point: proj.end_point || "",
          total_length: proj.total_length || 0,
          funding_source: proj.funding_source || "",
          resettlement_plan: proj.resettlement_plan || "",
          other_documents: proj.other_documents || "",
          households: proj.households || [],
          employees: proj.employees || [],
          lands: proj.lands,
          createdAt: proj.createdAt?._seconds
            ? dayjs.unix(proj.createdAt._seconds).format("YYYY-MM-DD HH:mm:ss")
            : "",
          updatedAt: proj.updatedAt?._seconds
            ? dayjs.unix(proj.updatedAt._seconds).format("YYYY-MM-DD HH:mm:ss")
            : "",
        })) || [];

      setProjects(list);
      setFilteredProjects(list);
    } catch (err) {
      message.error("Không thể tải danh sách dự án");
    } finally {
      setLoading(false);
    }
  };

  // ================== Check và mở lại modal khi quay về ==================
  useEffect(() => {
    fetchProjects();
  }, []);

  // ================== Reopen Modal nếu có dữ liệu trong localStorage ==================
  useEffect(() => {
    if (projects.length === 0) return;

    const reopenData = localStorage.getItem("reopenModal");
    const tempFormData = localStorage.getItem("tempFormData");

    console.log('reopenData:', reopenData);
    console.log('tempFormData:', tempFormData);

    if (!reopenData) return;

    try {
      const { type, projectId } = JSON.parse(reopenData);
      let restoreData = null;

      if (tempFormData) {
        restoreData = JSON.parse(tempFormData);
      }

      localStorage.removeItem("reopenModal");
      localStorage.removeItem("tempFormData");

      const proj = projects.find(p => p.id === projectId || p.key === projectId);

      if (type === "view" && proj) {
        setViewProject(proj);
        setIsViewModalVisible(true);
      }
      else if (type === "edit" && proj) {
        openModal(proj, restoreData);
      }
      else if (type === "add" && projectId === "new") {
        openModal(null, restoreData);
      }
    } catch (err) {
      console.error("Error parsing reopenModal data:", err);
      localStorage.removeItem("reopenModal");
      localStorage.removeItem("tempFormData");
    }
  }, [projects]);

  // ================== Helper function to convert DB files to upload format ==================
  const convertDbFilesToUploadFormat = (files) => {
    if (!files) return [];

    const extractOriginalFileName = (url) => {
      const fullName = decodeURIComponent(url.split("/").pop().split("?")[0]);
      // Bỏ phần UUID và timestamp, chỉ lấy tên file gốc
      const parts = fullName.split("_");
      if (parts.length > 1) {
        return parts.slice(1).join("_");
      }
      return fullName.substring(fullName.indexOf("-") + 1);
    };

    // Nếu là string (1 file)
    if (typeof files === "string") {
      return [{
        uid: Date.now().toString(),
        name: extractOriginalFileName(files),
        status: 'done',
        url: files,
        response: { url: files }
      }];
    }

    // Nếu là array
    if (Array.isArray(files)) {
      return files.map((fileUrl, index) => ({
        uid: `${Date.now()}-${index}`,
        name: extractOriginalFileName(fileUrl),
        status: 'done',
        url: fileUrl,
        response: { url: fileUrl }
      }));
    }

    return [];
  };

  // ================== Open modal - FIXED VERSION ==================
  const openModal = (project = null, restoreData = null) => {
    form.resetFields();
    setEditingProject(project);

    if (!project) {
      // Thêm mới
      if (restoreData) {
        // Restore dữ liệu đã lưu
        const formattedValues = {
          ...restoreData.formValues,
          approval_date: restoreData.formValues.approval_date ? dayjs(restoreData.formValues.approval_date) : null,
          map_approval_date: restoreData.formValues.map_approval_date ? dayjs(restoreData.formValues.map_approval_date) : null,
          land_price_approval_date: restoreData.formValues.land_price_approval_date ? dayjs(restoreData.formValues.land_price_approval_date) : null,
          plan_approval_date: restoreData.formValues.plan_approval_date ? dayjs(restoreData.formValues.plan_approval_date) : null,
          compensation_plan_approval_date: restoreData.formValues.compensation_plan_approval_date ? dayjs(restoreData.formValues.compensation_plan_approval_date) : null,
          site_clearance_start_date: restoreData.formValues.site_clearance_start_date ? dayjs(restoreData.formValues.site_clearance_start_date) : null,
        };

        form.setFieldsValue(formattedValues);

        // Restore selected data
        if (restoreData.selectedHouseholds) {
          dispatch(setSelectedHouseholds(restoreData.selectedHouseholds));
        }
        if (restoreData.selectedEmployees) {
          dispatch(setSelectedEmployees(restoreData.selectedEmployees));
        }
        if (restoreData.selectedLandPrices) {
          dispatch(setSelectedLandPrices(restoreData.selectedLandPrices));
        }
      } else {
        // Clear state cho thêm mới
        dispatch(clearHouseholds());
        dispatch(clearEmployees());
        dispatch(clearLandPrices());
      }
    } else {
      // Sửa project
      const formValues = {
        project_code: project.project_code,
        project_name: project.name,
        investor: project.investor,
        approval_decision_no: project.approval_decision_no,
        approval_date: project.approval_date ? dayjs(project.approval_date) : null,
        map_no: project.map_no,
        map_approval_date: project.map_approval_date ? dayjs(project.map_approval_date) : null,
        land_price_decision_no: project.land_price_decision_no,
        land_price_approval_date: project.land_price_approval_date ? dayjs(project.land_price_approval_date) : null,
        compensation_plan_decision_no: project.compensation_plan_decision_no,
        compensation_plan_approval_date: project.compensation_plan_approval_date ? dayjs(project.compensation_plan_approval_date) : null,
        compensation_plan_no: project.compensation_plan_no,
        plan_approval_date: project.plan_approval_date ? dayjs(project.plan_approval_date) : null,
        site_clearance_start_date: project.site_clearance_start_date ? dayjs(project.site_clearance_start_date) : null,
        project_status: project.project_status,
        project_objectives: project.project_objectives,
        project_scale: project.project_scale,
        project_location: project.project_location,
        construction_cost: project.construction_cost,
        project_management_cost: project.project_management_cost,
        consulting_cost: project.consulting_cost,
        other_costs: project.other_costs,
        contingency_cost: project.contingency_cost,
        land_clearance_cost: project.land_clearance_cost,
        start_point: project.start_point,
        end_point: project.end_point,
        total_length: project.total_length,
        funding_source: project.funding_source,
        resettlement_plan: project.resettlement_plan,
        other_documents: project.other_documents,
        // Convert files
        approval_decision_file: convertDbFilesToUploadFormat(project.approval_decision_file),
        map_file: convertDbFilesToUploadFormat(project.map_file),
        land_price_file: convertDbFilesToUploadFormat(project.land_price_file),
        plan_file: convertDbFilesToUploadFormat(project.plan_file),
        compensation_plan_file: convertDbFilesToUploadFormat(project.compensation_plan_file),
        other_files: convertDbFilesToUploadFormat(project.other_documents),
      };

      form.setFieldsValue(formValues);

      // Set selected data từ project hoặc restoreData
      if (restoreData) {
        // Ưu tiên dữ liệu từ restore (đã được update)
        if (restoreData.selectedHouseholds) {
          dispatch(setSelectedHouseholds(restoreData.selectedHouseholds));
        }
        if (restoreData.selectedEmployees) {
          dispatch(setSelectedEmployees(restoreData.selectedEmployees));
        }
        if (restoreData.selectedLandPrices) {
          dispatch(setSelectedLandPrices(restoreData.selectedLandPrices));
        }

        // Restore form data nếu có thay đổi
        if (restoreData.formValues) {
          const formattedRestoreValues = {
            ...restoreData.formValues,
            approval_date: restoreData.formValues.approval_date ? dayjs(restoreData.formValues.approval_date) : formValues.approval_date,
            map_approval_date: restoreData.formValues.map_approval_date ? dayjs(restoreData.formValues.map_approval_date) : formValues.map_approval_date,
            land_price_approval_date: restoreData.formValues.land_price_approval_date ? dayjs(restoreData.formValues.land_price_approval_date) : formValues.land_price_approval_date,
            plan_approval_date: restoreData.formValues.plan_approval_date ? dayjs(restoreData.formValues.plan_approval_date) : formValues.plan_approval_date,
            compensation_plan_approval_date: restoreData.formValues.compensation_plan_approval_date ? dayjs(restoreData.formValues.compensation_plan_approval_date) : formValues.compensation_plan_approval_date,
            site_clearance_start_date: restoreData.formValues.site_clearance_start_date ? dayjs(restoreData.formValues.site_clearance_start_date) : formValues.site_clearance_start_date,
          };
          form.setFieldsValue({ ...formValues, ...formattedRestoreValues });
        }
      } else {
        // Dữ liệu gốc từ project
        dispatch(setSelectedHouseholds((project.households || []).map(id => ({ id }))));
        dispatch(setSelectedEmployees((project.employees || []).map(id => ({ id }))));
        const landsArray = Array.isArray(project.lands) ? project.lands : [];
        dispatch(setSelectedLandPrices(landsArray.map(id => ({ id }))));

      }
    }

    setIsModalVisible(true);
  };

  // ================== Navigation functions với save data ==================
  const navigateToHouseholdsEdit = () => {
    const formData = form.getFieldsValue(true);
    const dataToSave = {
      formValues: formData,
      selectedHouseholds,
      selectedEmployees,
      selectedLandPrices
    };

    localStorage.setItem("tempFormData", JSON.stringify(dataToSave));
    setIsModalVisible(false);
    localStorage.setItem("reopenModal", JSON.stringify({
      type: editingProject ? "edit" : "add",
      projectId: editingProject?.id || "new"
    }));
    navigate(`/system/admin/households/${editingProject?.id || "new"}/edit`);
  };

  const navigateToLandPricesEdit = () => {
    const formData = form.getFieldsValue(true);
    const dataToSave = {
      formValues: formData,
      selectedHouseholds,
      selectedEmployees,
      selectedLandPrices
    };

    localStorage.setItem("tempFormData", JSON.stringify(dataToSave));
    setIsModalVisible(false);
    localStorage.setItem("reopenModal", JSON.stringify({
      type: editingProject ? "edit" : "add",
      projectId: editingProject?.id || "new"
    }));
    navigate(`/system/admin/lands/${editingProject?.id || "new"}/edit`);
  };

  const navigateToEmployeesEdit = () => {
    const formData = form.getFieldsValue(true);
    const dataToSave = {
      formValues: formData,
      selectedHouseholds,
      selectedEmployees,
      selectedLandPrices
    };

    localStorage.setItem("tempFormData", JSON.stringify(dataToSave));
    setIsModalVisible(false);
    localStorage.setItem("reopenModal", JSON.stringify({
      type: editingProject ? "edit" : "add",
      projectId: editingProject?.id || "new"
    }));
    navigate(`/system/admin/employees/${editingProject?.id || "new"}/edit`);
  };

  const navigateToHouseholdsAdd = () => {
    const formData = form.getFieldsValue(true);
    const dataToSave = {
      formValues: formData,
      selectedHouseholds,
      selectedEmployees,
      selectedLandPrices
    };

    localStorage.setItem("tempFormData", JSON.stringify(dataToSave));
    setIsModalVisible(false);
    localStorage.setItem("reopenModal", JSON.stringify({
      type: "add",
      projectId: "new"
    }));
    navigate(`/system/admin/households/new/add`);
  };

  const navigateToLandPricesAdd = () => {
    const formData = form.getFieldsValue(true);
    const dataToSave = {
      formValues: formData,
      selectedHouseholds,
      selectedEmployees,
      selectedLandPrices
    };

    localStorage.setItem("tempFormData", JSON.stringify(dataToSave));
    setIsModalVisible(false);
    localStorage.setItem("reopenModal", JSON.stringify({
      type: "add",
      projectId: "new"
    }));
    navigate(`/system/admin/lands/new/add`);
  };

  // ================== Add / Update ==================
  const handleSubmit = async (values) => {
    try {
      setUpdating(true);

      if (!values.project_code || !values.project_name) {
        message.error("Vui lòng nhập đầy đủ thông tin bắt buộc!");
        return;
      }

      // Hàm upload file trước và trả về URL
      const processFiles = async (fileList, fieldName) => {
        if (!fileList || !Array.isArray(fileList)) return null;
        const uploadedFiles = [];

        for (const f of fileList) {
          if (f.url) {
            uploadedFiles.push(f.url); // file đã có URL
          } else if (f.originFileObj) {
            try {
              const formData = new FormData();
              formData.append(fieldName, f.originFileObj);
              const res = await uploadFile(formData, user?.access_token);
              if (res?.files?.[0]?.url) {
                uploadedFiles.push(res.files[0].url);
              }
            } catch (uploadErr) {
              console.error("Error uploading file:", uploadErr);
              message.warning(`Không thể upload file ${f.name}`);
            }
          }
        }
        return uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles;
      };

      // Upload tất cả file trước
      const uploadedApprovalDecisionFile = await processFiles(values.approval_decision_file, 'approval_decision_file');
      const uploadedMapFile = await processFiles(values.map_file, 'map_file');
      const uploadedLandPriceFile = await processFiles(values.land_price_file, 'land_price_file');
      const uploadedCompensationPlanFile = await processFiles(values.compensation_plan_file, 'compensation_plan_file');
      const uploadedPlanFile = await processFiles(values.plan_file, 'plan_file');
      const uploadedOtherFiles = await processFiles(values.other_files, 'other_files');

      // Chuẩn bị payload JSON để gửi lên backend
      const payload = {
        project_code: values.project_code,
        project_name: values.project_name,
        investor: values.investor || "",
        approval_decision_no: values.approval_decision_no || "",
        approval_date: values.approval_date ? values.approval_date.format("YYYY-MM-DD") : "",
        map_no: values.map_no || "",
        map_approval_date: values.map_approval_date ? values.map_approval_date.format("YYYY-MM-DD") : "",
        land_price_decision_no: values.land_price_decision_no || "",
        land_price_approval_date: values.land_price_approval_date ? values.land_price_approval_date.format("YYYY-MM-DD") : "",
        compensation_plan_decision_no: values.compensation_plan_decision_no || "",
        compensation_plan_approval_date: values.compensation_plan_approval_date ? values.compensation_plan_approval_date.format("YYYY-MM-DD") : "",
        compensation_plan_no: values.compensation_plan_no || "",
        plan_approval_date: values.plan_approval_date ? values.plan_approval_date.format("YYYY-MM-DD") : "",
        site_clearance_start_date: values.site_clearance_start_date ? values.site_clearance_start_date.format("YYYY-MM-DD") : "",
        project_status: values.project_status || "",
        project_objectives: values.project_objectives || "",
        project_scale: values.project_scale || "",
        project_location: values.project_location || "",
        construction_cost: values.construction_cost || 0,
        project_management_cost: values.project_management_cost || 0,
        consulting_cost: values.consulting_cost || 0,
        other_costs: values.other_costs || 0,
        contingency_cost: values.contingency_cost || 0,
        land_clearance_cost: values.land_clearance_cost || 0,
        start_point: values.start_point || "",
        end_point: values.end_point || "",
        total_length: values.total_length || 0,
        funding_source: values.funding_source || "",
        resettlement_plan: values.resettlement_plan || "",
        approval_decision_file: uploadedApprovalDecisionFile,
        map_file: uploadedMapFile,
        land_price_file: uploadedLandPriceFile,
        compensation_plan_file: uploadedCompensationPlanFile,
        plan_file: uploadedPlanFile,
        other_documents: uploadedOtherFiles,
        households: selectedHouseholds.map(h => h.id).filter(Boolean),
        employees: selectedEmployees.map(e => e.id).filter(Boolean),
        lands: selectedLandPrices.map(e => e.id).filter(Boolean),
      };

      let result;
      if (editingProject) {
        result = await ProjectService.updateProject(editingProject.key, payload, user?.access_token);
        message.success("Cập nhật dự án thành công!");
      } else {
        result = await ProjectService.createProject(payload, user?.access_token);
        message.success("Thêm dự án thành công!");
      }

      // Xử lý cập nhật state local
      const savedProject = result.data || result;
      const parsedHouseholds = typeof savedProject.households === 'string' ? JSON.parse(savedProject.households) : (savedProject.households || []);
      const parsedEmployees = typeof savedProject.employees === 'string' ? JSON.parse(savedProject.employees) : (savedProject.employees || []);
      const parsedLands = typeof savedProject.lands === 'string' ? JSON.parse(savedProject.lands) : (savedProject.lands || []);

      const projectItem = {
        key: savedProject.id,
        ...savedProject,
        households: parsedHouseholds,
        employees: parsedEmployees,
        lands: parsedLands
      };

      if (editingProject) {
        setProjects(prev => prev.map(p => p.key === projectItem.key ? projectItem : p));
        setFilteredProjects(prev => prev.map(p => p.key === projectItem.key ? projectItem : p));
      } else {
        setProjects(prev => [...prev, projectItem]);
        setFilteredProjects(prev => [...prev, projectItem]);
      }
      await fetchProjects();
      // Clean up
      localStorage.removeItem("tempProjectData");
      localStorage.removeItem("tempFormData");
      localStorage.removeItem("reopenModal");
      dispatch(clearHouseholds());
      dispatch(clearEmployees());
      dispatch(clearLandPrices());

      form.resetFields();
      setEditingProject(null);
      setIsModalVisible(false);

    } catch (err) {
      console.error(">>> API Error:", err);
      message.error(err?.message || err?.response?.data?.message || "Thao tác thất bại!");
    } finally {
      setUpdating(false);
    }
  };

  // ================== Delete ==================
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  const handleDelete = (proj) => {
    setCurrentProject(proj);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await ProjectService.deleteProject(currentProject.key, user?.access_token);
      setProjects(prev => prev.filter(p => p.key !== currentProject.key));
      setFilteredProjects(prev => prev.filter(p => p.key !== currentProject.key));
      message.success("Xóa dự án thành công!");
      setIsDeleteModalVisible(false);
    } catch {
      message.error("Xóa thất bại!");
    }
  };

  const statusMap = {
    in_progress: "Đang thực hiện",
    completed: "Hoàn thành",
    draft: "Chưa hoàn thành",
  };

  // ================== Columns ==================
  const columns = [
    { title: "Mã dự án", dataIndex: "project_code", key: "project_code" },
    { title: "Tên dự án", dataIndex: "name", key: "name" },
    { title: "Chủ đầu tư", dataIndex: "investor", key: "investor" },
    { title: "Trạng thái", dataIndex: "project_status", render: (text) => statusMap[text] || text },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: "Xem chi tiết",
            icon: <EyeOutlined />,
            onClick: () => {
              if (setViewProject && setIsViewModalVisible) {
                setViewProject(record);
                setIsViewModalVisible(true);
              } else {
                console.log("Xem chi tiết:", record);
              }
            },
          },
          {
            key: "edit",
            label: "Sửa",
            icon: <EditOutlined />,
            onClick: () => {
              if (openModal) {
                openModal(record);
              } else {
                console.log("Sửa dự án:", record);
              }
            },
          },
          {
            key: "delete",
            label: "Xóa",
            icon: <DeleteOutlined />,
            onClick: () => {
              if (handleDelete) {
                handleDelete(record);
              } else {
                console.log("Xóa dự án:", record);
              }
            },
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

  const projectSections = [
    {
      title: "Thông tin cơ bản",
      fields: [
        { name: "project_code", label: "Mã dự án", type: "input", rules: [{ required: true, message: "Vui lòng nhập mã dự án!" }], inputCol: 6, },
        { name: "project_name", label: "Tên dự án", type: "input", rules: [{ required: true, message: "Vui lòng nhập tên dự án!" }], inputCol: 6, },
        { name: "investor", label: "Chủ đầu tư", type: "input", inputCol: 6, },
      ],
    },
    {
      fields: [
        {
          label: "Quyết định phê duyệt dự án",
          group: [
            { name: "approval_decision_no", label: "Số quyết định", type: "input", inputCol: 6 },
            { name: "approval_date", label: "Ngày phê duyệt", type: "date", inputCol: 6 },
            { name: "approval_decision_file", label: "Đính kèm", type: "upload", inputCol: 12 },
          ],
        },
        {
          label: "Bản đồ hiện trạng vị trí đã được sở duyệt",
          group: [
            {
              name: "map_no",
              label: "Số bản đồ hiện trạng",
              type: "input",
              inputCol: 6,
            },
            {
              name: "map_approval_date",
              label: "Ngày phê duyệt",
              type: "date",
              inputCol: 6,
            },
            {
              name: "map_file",
              label: "Đính kèm",
              type: "upload",
              inputCol: 12,
              maxCount: 5,
            },
          ],
        },
        {
          label: "Quyết định phê duyệt giá đất",
          group: [
            {
              name: "land_price_decision_no",
              label: "Số QĐ giá đất",
              type: "input",
              inputCol: 6,
            },
            {
              name: "land_price_approval_date",
              label: "Ngày phê duyệt",
              type: "date",
              inputCol: 6,
            },
            {
              name: "land_price_file",
              label: "Đính kèm",
              type: "upload",
              inputCol: 12,
              maxCount: 5,
            },
          ],
        },
        {
          label: "Phương án BT,HT,TĐC",
          group: [
            {
              name: "compensation_plan_no",
              label: "Số PA BT, HT, TĐC",
              type: "input",
              inputCol: 6,
            },
            {
              name: "plan_approval_date",
              label: "Ngày phê duyệt",
              type: "date",
              inputCol: 6,
            },
            {
              name: "plan_file",
              label: "Đính kèm",
              type: "upload",
              inputCol: 12,
              maxCount: 5,
            },
          ],
        },
        {
          label: "Quyết định phê duyệt phương án BTHTTĐC",
          group: [
            {
              name: "compensation_plan_decision_no",
              label: "Số QĐ phê duyệt PA BT, HT, TĐC",
              type: "input",
              inputCol: 6,
            },
            {
              name: "compensation_plan_approval_date",
              label: "Ngày phê duyệt",
              type: "date",
              inputCol: 6,
            },
            {
              name: "compensation_plan_file",
              label: "Đính kèm",
              type: "upload",
              inputCol: 12,
              maxCount: 5,
            },
          ],
        },
      ],
    },
    {
      fields: [
        {
          label: "Ngày bắt đầu BTGPMB",
          group: [
            {
              name: "site_clearance_start_date",
              label: "Ngày bắt đầu BTGPMB",
              type: "date",
              inputCol: 6,
            },  
            {
              name: "project_status",
              label: "Trạng thái dự án",
              type: "select",
              options: [
                { label: "Đang thực hiện", value: "in_progress" },
                { label: "Hoàn thành", value: "completed" },
                { label: "Chưa hoàn thành", value: "draft" },
              ],
              inputCol: 6,
            },
          ],
        },
        {
          name: "other_files",
          label: "Văn bản đính kèm khác",
          type: "upload",
          inputCol: 12,
          maxCount: 10,
        },
        {
          name: "project_objectives",
          label: "Mục tiêu dự án",
          type: "textarea",
          inputCol: 12,
        },
        {
          name: "project_scale",
          label: "Quy mô dự án",
          type: "textarea",
          inputCol: 12,
        },
        {
          name: "project_location",
          label: "Địa điểm dự án",
          type: "textarea",
          inputCol: 12,
        },
        {
          name: "funding_source",
          label: "Nguồn vốn dự án",
          type: "textarea",
          inputCol: 12,
        },
        {
          name: "resettlement_plan",
          label: "Kế hoạch bố trí TĐC",
          type: "textarea",
          inputCol: 12,
        },
      ],
    },
  ];



  // ================== Search ==================


  useEffect(() => {
    const keyword = searchKeyword.toLowerCase();
    setFilteredProjects(projects.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.project_code.toLowerCase().includes(keyword)
    ));
  }, [searchKeyword, projects]);

  return (
    <div className="p-1">
      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-4"> Quản lý dự án
        </h2>
      </div>

      <FilterContainer className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm dự án..."
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          style={{ width: 300 }}
        />
        <HeaderActions>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Thêm dự án
          </Button>
        </HeaderActions>
      </FilterContainer>

      <Spin spinning={loading}>
        <div className="bg-white rounded-2xl shadow p-4 max-h-[70vh] overflow-y-auto">
          <Table
            columns={columns}
            dataSource={filteredProjects}
            pagination={{ pageSize: 5 }}
            size="small"
            bordered
            rowKey="key"
            className="text-sm [&_.ant-table]:text-sm [&_.ant-table-cell]:px-3 [&_.ant-table-cell]:py-2"
          />
        </div>
      </Spin>

      {/* Modal xem */}
      <ViewModal
        visible={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        title="Chi tiết dự án"
        record={viewProject}
        sections={projectSections}>
        <Divider orientation="left">Hộ dân liên quan</Divider>
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={24}>
            {viewProject?.id && (
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/system/admin/households/${viewProject.id}/view`)
                }
              >
                Xem tất cả hộ dân
              </Button>
            )}
          </Col>
        </Row>

        <Divider orientation="left">Nhân sự tham gia</Divider>
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={24}>
            {viewProject?.id && (
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/system/admin/employees/${viewProject.id}/view`)
                }
              >
                Xem tất cả nhân sự
              </Button>
            )}
          </Col>
        </Row>

        <Divider orientation="left">Bảng giá đất liên quan</Divider>
        <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={24}>
            {viewProject?.id && (
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/system/admin/lands/${viewProject.id}/view`)
                }
              >
                Xem tất cả bảng giá đất
              </Button>
            )}
          </Col>
        </Row>
      </ViewModal>
      {/* Modal xóa */}
      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn xóa dự án {currentProject?.name}?</p>
      </Modal>
      {/* Modal thêm sửa */}
      <EditModal
        title={editingProject ? "Sửa dự án" : "Thêm dự án"}
        visible={isModalVisible}
        form={form}
        sections={projectSections}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProject(null);
          form.resetFields();
          dispatch(clearHouseholds());
          dispatch(clearEmployees());
          dispatch(clearLandPrices());
          localStorage.removeItem("tempFormData");
          localStorage.removeItem("reopenModal");
        }}
      >
        <Form form={form} layout="horizontal" onFinish={handleSubmit}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Space size="large">
                {/* Hộ dân */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: 8, fontWeight: 500 }}>
                    Hộ dân ({selectedHouseholds.length}):
                  </span>
                  {editingProject ? (
                    <Button type="link" icon={<EditOutlined />} onClick={navigateToHouseholdsEdit}>
                      Sửa hộ dân
                    </Button>
                  ) : (
                    <Button type="dashed" icon={<PlusOutlined />} onClick={navigateToHouseholdsAdd}>
                      Thêm hộ dân
                    </Button>
                  )}
                </div>

                {/* Đơn giá đất */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: 8, fontWeight: 500 }}>
                    Đơn giá đất ({selectedLandPrices.length}):
                  </span>
                  {editingProject ? (
                    <Button type="link" icon={<EditOutlined />} onClick={navigateToLandPricesEdit}>
                      Sửa đơn giá đất
                    </Button>
                  ) : (
                    <Button type="dashed" icon={<PlusOutlined />} onClick={navigateToLandPricesAdd}>
                      Thêm đơn giá đất
                    </Button>
                  )}
                </div>

                {/* Nhân viên */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: 8, fontWeight: 500 }}>
                    Nhân viên ({selectedEmployees.length}):
                  </span>
                  {editingProject ? (
                    <Button type="link" icon={<EditOutlined />} onClick={navigateToEmployeesEdit}>
                      Sửa nhân viên
                    </Button>
                  ) : (
                    <Button type="dashed" icon={<PlusOutlined />} onClick={navigateToEmployeesEdit}>
                      Thêm nhân viên
                    </Button>
                  )}
                </div>
              </Space>
            </Col>
          </Row>
        </Form>
      </EditModal>

    </div >
  );
}