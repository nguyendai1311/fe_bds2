import { useState, useEffect } from "react";
import { Card, Select, InputNumber } from "antd";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area
} from "recharts";
import dayjs from "dayjs";
import * as StatisficService from "../../../services/StatisficService";

const { Option } = Select;
const defaultYear = dayjs().year();
const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

export default function ReportPage() {
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);

  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  // ===== Fetch dữ liệu năm (group theo tháng) =====
  const fetchByYear = async (year) => {
    try {
      const res = await StatisficService.getStatusHouseHoldByYear(year);
      if (res.status === "success") {
        const data = Object.entries(res.data).map(([month, val]) => ({
          month: `T${month}`,
          count: val.completed, // chỉ lấy số completed
        }));
        setMonthlyData(data);
      }
    } catch (err) {
      console.error("Lỗi fetch by year:", err);
    }
  };

  // ===== Fetch dữ liệu tháng (pie + daily chart) =====
  const fetchByMonth = async (year, month) => {
    try {
      // Pie chart (status trong tháng)
      const resMonth = await StatisficService.getStatusHouseHoldByYear(year, month);
      if (resMonth.status === "success") {
        const { data } = resMonth;
        setCategoryData([
          { name: "Chưa thực hiện", value: data.draft },
          { name: "Đang làm", value: data.in_progress },
          { name: "Hoàn thành", value: data.completed },
        ]);
      }

      // Daily chart (completed theo ngày trong tháng)
      const resDay = await StatisficService.getStatusHouseHoldByDay(year, month);
      if (resDay.status === "success") {
        const data = Object.entries(resDay.data).map(([day, val]) => ({
          day: `Ngày ${day}`,
          count: val.completed, // chỉ lấy completed
        }));
        setDailyData(data);
      }
    } catch (err) {
      console.error("Lỗi fetch by month:", err);
    }
  };

  useEffect(() => {
    fetchByYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    fetchByMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  return (
    <div className="p-3">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-4">Báo Cáo Thống Kê</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium">Năm:</span>
            <InputNumber
              min={2000}
              max={2100}
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 100 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Tháng:</span>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 90 }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Option key={m} value={m}>{`T${m}`}</Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Grid Biểu đồ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Biểu đồ cột */}
        <Card size="small" title={`Hồ sơ hoàn thành trong năm ${selectedYear}`} className="rounded-xl">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barCategoryGap={20}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1890ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Biểu đồ đường */}
        <Card size="small" title={`Hồ sơ hoàn thành trong tháng ${selectedMonth}/${selectedYear}`} className="rounded-xl">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData}>
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#52c41a" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Biểu đồ tròn */}
        <Card size="small" title="Tỉ lệ trạng thái hồ sơ" className="rounded-xl">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Biểu đồ area */}
        <Card size="small" title="Xu hướng tích lũy hồ sơ theo ngày" className="rounded-xl">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyData}>
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#faad14" fill="#faad14" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}



// import { useState, useEffect } from "react";
// import { Card, Select, InputNumber } from "antd";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   LineChart, Line,
//   PieChart, Pie, Cell,
//   AreaChart, Area
// } from "recharts";
// import dayjs from "dayjs";

// const { Option } = Select;
// const defaultYear = dayjs().year();

// // Màu cho PieChart
// const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

// export default function ReportPage() {
//   const [selectedYear, setSelectedYear] = useState(defaultYear);
//   const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);

//   const [monthlyData, setMonthlyData] = useState([]);
//   const [dailyData, setDailyData] = useState([]);
//   const [categoryData, setCategoryData] = useState([]);

//   useEffect(() => {
//     fetchCompletedYear(selectedYear);
//   }, [selectedYear]);

//   useEffect(() => {
//     fetchCompletedMonth(selectedYear, selectedMonth);
//   }, [selectedYear, selectedMonth]);

//   // Dữ liệu mock theo năm
//   const fetchCompletedYear = (year) => {
//     const mock = Array.from({ length: 12 }, (_, i) => ({
//       month: `T${i + 1}`,
//       count: Math.floor(Math.random() * 100) + 10,
//     }));
//     setMonthlyData(mock);

//     // dữ liệu phân loại ảo
//     setCategoryData([
//       { name: "Đã hoàn thành", value: Math.floor(Math.random() * 100) + 50 },
//       { name: "Đang xử lý", value: Math.floor(Math.random() * 50) + 10 },
//       { name: "Bị từ chối", value: Math.floor(Math.random() * 30) + 5 },
//       { name: "Chưa bắt đầu", value: Math.floor(Math.random() * 20) + 5 },
//     ]);
//   };

//   // Dữ liệu mock theo tháng
//   const fetchCompletedMonth = (year, month) => {
//     const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
//     const mock = Array.from({ length: daysInMonth }, (_, i) => ({
//       day: `Ngày ${i + 1}`,
//       count: Math.floor(Math.random() * 10),
//     }));
//     setDailyData(mock);
//   };

//   return (
//     <div className="p-3">
//       {/* Header */}
//       <div className="mb-3">
//         <h2 className="text-xl font-semibold mb-4">Báo Cáo Thống Kê</h2>
//         <div className="flex items-center gap-6">
//           <div className="flex items-center gap-2">
//             <span className="font-medium">Năm:</span>
//             <InputNumber
//               min={2000}
//               max={2100}
//               value={selectedYear}
//               onChange={setSelectedYear}
//               style={{ width: 100 }}
//             />
//           </div>

//           <div className="flex items-center gap-2">
//             <span className="font-medium">Tháng:</span>
//             <Select
//               value={selectedMonth}
//               onChange={setSelectedMonth}
//               style={{ width: 90 }}
//             >
//               {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
//                 <Option key={m} value={m}>{`T${m}`}</Option>
//               ))}
//             </Select>
//           </div>
//         </div>
//       </div>

//       {/* Grid Biểu đồ */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {/* Biểu đồ cột */}
//         <Card
//           size="small"
//           title={`Hồ sơ hoàn thành trong năm ${selectedYear}`}
//           className="rounded-xl"
//         >
//           <ResponsiveContainer width="100%" height={180}>
//             <BarChart data={monthlyData} barCategoryGap={20}>
//               <XAxis dataKey="month" />
//               <YAxis allowDecimals={false} />
//               <Tooltip />
//               <Bar dataKey="count" fill="#1890ff" radius={[6, 6, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </Card>

//         {/* Biểu đồ đường */}
//         <Card
//           size="small"
//           title={`Hồ sơ hoàn thành trong tháng ${selectedMonth}/${selectedYear}`}
//           className="rounded-xl"
//         >
//           <ResponsiveContainer width="100%" height={180}>
//             <LineChart data={dailyData}>
//               <XAxis dataKey="day" />
//               <YAxis allowDecimals={false} />
//               <Tooltip />
//               <Line type="monotone" dataKey="count" stroke="#52c41a" strokeWidth={2} dot={{ r: 2 }} />
//             </LineChart>
//           </ResponsiveContainer>
//         </Card>

//         {/* Biểu đồ tròn */}
//         <Card size="small" title="Tỉ lệ trạng thái hồ sơ" className="rounded-xl">
//           <ResponsiveContainer width="100%" height={180}>
//             <PieChart>
//               <Pie
//                 data={categoryData}
//                 cx="50%"
//                 cy="50%"
//                 outerRadius={60}
//                 dataKey="value"
//                 label={({ name, percent }) =>
//                   `${name}: ${(percent * 100).toFixed(0)}%`
//                 }
//               >
//                 {categoryData.map((_, i) => (
//                   <Cell key={i} fill={COLORS[i % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//             </PieChart>
//           </ResponsiveContainer>
//         </Card>

//         {/* Biểu đồ area */}
//         <Card size="small" title="Xu hướng tích lũy hồ sơ theo ngày" className="rounded-xl">
//           <ResponsiveContainer width="100%" height={180}>
//             <AreaChart data={dailyData}>
//               <XAxis dataKey="day" />
//               <YAxis allowDecimals={false} />
//               <Tooltip />
//               <Area
//                 type="monotone"
//                 dataKey="count"
//                 stroke="#faad14"
//                 fill="#faad14"
//                 fillOpacity={0.4}
//               />
//             </AreaChart>
//           </ResponsiveContainer>
//         </Card>
//       </div>
//     </div>
//   );
// }