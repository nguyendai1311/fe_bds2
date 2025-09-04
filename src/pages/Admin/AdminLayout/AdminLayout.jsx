import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../../components/Admin/AdminSidebar/AdminSidebar";
import Header from "../../../components/Admin/AdminHeader/AdminHeader";
import { Wrapper, Content, Main } from "./style";
import Footer from "../../../components/footerComponent/footer";

const AdminLayout = () => {
  return (
    <Wrapper>
      <Sidebar />
      <Content>
        <Header />
        <Main>
          <Outlet />
        </Main>
        <Footer />
      </Content>
    </Wrapper>
  );
};

export default AdminLayout;
