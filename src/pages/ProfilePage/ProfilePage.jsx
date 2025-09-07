import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UploadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import InputForm from "../../components/InputForm/InputForm";
import ButtonComponent from "../../components/ButtonComponent/ButtonComponent";
import * as UserService from "../../services/UserService";
import { updateUser } from "../../redux/slices/userSlice";
import { useMutationHooks } from "../../hooks/useMutationHooks";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  WrapperHeader,
  WrapperProfileContainer,
  WrapperAvatarSection,
  WrapperInfoSection,
  WrapperInput,
  WrapperLabel,
  WrapperUploadFile,
  WrapperButton,
  AvatarImage,
  DefaultAvatar,
} from "./style";

const ProfilePage = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [avatar, setAvatar] = useState("");
  const [citizenId, setCitizenId] = useState("");

  const mutation = useMutationHooks((data) => {
    const { id, access_token, ...rest } = data;
    return UserService.updateUser(id, rest, access_token);
  });

  const { isSuccess, isError } = mutation;

  // Gán dữ liệu từ Redux vào form
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setName(user.name || "");
      setAvatar(user.avatar || "");
      setPhone(user.phone || "");
      setFullAddress(user.full_address || "");
      setCitizenId(user.citizenId || "");
    }
  }, [user]);

  // Sau khi cập nhật thành công thì refresh lại thông tin user
  useEffect(() => {
    if (isSuccess) {
      toast.success("Cập nhật thông tin thành công!");
      handleGetDetailsUser(user?.id, user?.access_token);
    } else if (isError) {
      toast.error("Cập nhật thất bại!");
    }
  }, [isSuccess, isError]);

  const handleGetDetailsUser = async (id, token) => {
    const res = await UserService.getDetailsUser(id, token);
    dispatch(updateUser({ ...res?.data, access_token: token }));
  };

  const handleUpdate = () => {
    mutation.mutate({
      id: user?.id, // ✅ BE dùng _id
      name,
      email,
      avatar,
      full_address: fullAddress,
      phone,
      citizenId,
      access_token: user?.access_token,
    });
  };

  // Upload avatar Cloudinary
  const handleChangeAvatar = async ({ fileList }) => {
    const file = fileList[0];
    if (file && file.originFileObj && avatar !== file.originFileObj.name) {
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("upload_preset", "upload-uke86ro8");

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/dhyuxajq1/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await res.json();
        setAvatar(data.secure_url);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };

  return (
    <div>
      <WrapperHeader>Hồ sơ</WrapperHeader>
      <WrapperProfileContainer>
        {/* Avatar */}
        {/* Avatar */}
        <WrapperAvatarSection>
          {avatar ? (
            <AvatarImage src={avatar} alt="avatar" />
          ) : (
            <DefaultAvatar>
              <i className="fas fa-user" />
            </DefaultAvatar>
          )}
          <WrapperUploadFile
            showUploadList={false}
            beforeUpload={async (file) => {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("upload_preset", "upload-uke86ro8");

              try {
                const res = await fetch(
                  `https://api.cloudinary.com/v1_1/dhyuxajq1/image/upload`,
                  {
                    method: "POST",
                    body: formData,
                  }
                );
                const data = await res.json();
                setAvatar(data.secure_url);
              } catch (error) {
                console.error("Upload error:", error);
              }

              return false; // ⚡ chặn upload mặc định của Antd
            }}
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </WrapperUploadFile>
        </WrapperAvatarSection>


        {/* Thông tin */}
        <WrapperInfoSection>
          <WrapperInput>
            <WrapperLabel>Họ và tên</WrapperLabel>
            <InputForm
              value={name}
              onChange={setName}
              placeholder="Nhập họ và tên"
            />
          </WrapperInput>

          <WrapperInput>
            <WrapperLabel>Email</WrapperLabel>
            <InputForm value={email} placeholder="Email" disabled />
          </WrapperInput>

          <WrapperInput>
            <WrapperLabel>Số điện thoại</WrapperLabel>
            <InputForm
              value={phone}
              onChange={setPhone}
              placeholder="Nhập số điện thoại"
            />
          </WrapperInput>

          <WrapperInput>
            <WrapperLabel>Địa chỉ</WrapperLabel>
            <InputForm
              value={fullAddress}
              onChange={setFullAddress}
              placeholder="Nhập địa chỉ đầy đủ"
            />
          </WrapperInput>

          <WrapperInput>
            <WrapperLabel>Số CCCD</WrapperLabel>
            <InputForm
              value={citizenId}
              onChange={setCitizenId}
              placeholder="Nhập số căn cước công dân"
            />
          </WrapperInput>

          <WrapperButton>
            <ButtonComponent
              textbutton="Cập nhật"
              onClick={handleUpdate}
              size="large"
              styleButton={{
                background: "#1890ff",
                borderRadius: "8px",
                padding: "6px 20px",
                border: "none",
              }}
              styleTextButton={{
                color: "#fff",
                fontWeight: "bold",
              }}
            />
          </WrapperButton>
        </WrapperInfoSection>
      </WrapperProfileContainer>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ProfilePage;
