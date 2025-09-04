import React from "react";
import { Card, Row, Col, Button } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// 🎨 Data ảo cho PieChart
const chartData = [
  { name: "Đã duyệt", value: 80 },
  { name: "Đang xử lý", value: 30 },
  { name: "Mới nộp", value: 10 },
];
const COLORS = ["#52c41a", "#faad14", "#1890ff"];

export default function AdminDashboard() {
  return (
    <div className="p-4">
      {/* Thống kê nhanh */}
      <Row gutter={16}>
        <Col span={6}>
          <Card style={{ borderTop: "4px solid #1677ff" }}>
            <h3 className="text-blue-600 font-bold text-lg">120</h3>
            <p className="text-gray-600 font-medium">Tổng hồ sơ</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: "4px solid #52c41a" }}>
            <h3 className="text-green-600 font-bold text-lg">80</h3>
            <p className="text-gray-600">Đã duyệt</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: "4px solid #faad14" }}>
            <h3 className="text-orange-500 font-bold text-lg">30</h3>
            <p className="text-gray-600">Đang xử lý</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderTop: "4px solid #999" }}>
            <h3 className="text-gray-700 font-bold text-lg">10</h3>
            <p className="text-gray-600">Mới nộp</p>
          </Card>
        </Col>
      </Row>

      {/* Nội dung */}
      <Row gutter={16} className="mt-4">
        <Col span={12}>
          <Card title="Hồ sơ gần đây">
            <ul className="space-y-2">
              <li>
                <span className="font-medium">Nguyễn Văn A</span> —{" "}
                <span className="text-blue-500">Đang xử lý</span>
              </li>
              <li>
                <span className="font-medium">Trần Thị B</span> —{" "}
                <span className="text-green-600">Đã duyệt</span>
              </li>
              <li>
                <span className="font-medium">Phạm Văn C</span> —{" "}
                <span className="text-gray-600">Mới nộp</span>
              </li>
            </ul>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Thông báo mới">
            <ul className="space-y-2">
              <li>Có 3 hồ sơ vừa nộp sáng nay</li>
              <li>2 hồ sơ đã được duyệt</li>
              <li>1 hồ sơ cần bổ sung giấy tờ</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ + tác vụ */}
      <Row gutter={16} className="mt-4">
        <Col span={12}>
          <Card title="Tỷ lệ hồ sơ">
            {/* 🔑 Biểu đồ nhỏ lại */}
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70} // 👈 giảm size
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Tác vụ nhanh">
            <div className="flex flex-col gap-2">
              <Button type="primary">Tạo hồ sơ mới</Button>
              <Button>Quản lý nhân viên</Button>
              <Button>Quản lý dự án</Button>
              <Button>Quản lý đất</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
