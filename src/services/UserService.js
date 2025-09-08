import axios from "axios";

export const axiosJWT = axios.create();

export const loginUser = async (data) => {
  const res = await axios.post(
     `${process.env.REACT_APP_API_URL}/users/sign-in`,
    data
  );
  return res.data;
};

export const createUser = async (data, access_token) => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/users/create-user`,
      data,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log("Lỗi createUser:", error.response?.data || error);
    throw {
      status: "ERR",
      message: error.response?.data?.message || "Thêm nhân viên thất bại.",
    };
  }
};

export const sendOtp = async (data) => {
  try {
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/user/send-otp`,
      data
    );
    return res.data;
  } catch (error) {
    throw {
      status: "ERR",
      message: error.response?.data?.message || "Có lỗi xảy ra khi gửi OTP.",
    };
  }
};

export const resetPassword = async (data) => {
  const res = await axios.post(
    `${process.env.REACT_APP_API_URL}/users/reset-password`,
    data
  );
  return res.data;
};

export const resendOtp = async (data) => {
  const res = await axios.post(
    `${process.env.REACT_APP_API_URL}/users/resend-otp`,
    data
  );
  return res.data;
};

export const getDetailsUser = async (id, access_token) => {
  const res = await axiosJWT.get(
    `${process.env.REACT_APP_API_URL}/users/get-details/${id}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );
  return res.data;
};

export const deleteUser = async (id, access_token) => {
  try {
    const res = await axiosJWT.delete(
      `${process.env.REACT_APP_API_URL}/users/delete-user/${id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log("Lỗi deleteUser:", error.response?.data || error);
    throw {
      status: "ERR",
      message: error.response?.data?.message || "Xóa nhân viên thất bại.",
    };
  }
};

export const getAllUser = async (access_token, { page = 1, limit = 10, search = "" } = {}) => {
  try {
    const res = await axiosJWT.get(`${process.env.REACT_APP_API_URL}/users/get-all`, {
      params: { page, limit, search },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return res.data;
  } catch (err) {
    console.error("getAllUser error:", err);
    throw err;
  }
};

// Trong frontend service
export const refreshToken = async (refreshToken) => {
  try {
    console.log("Sending refresh token:", refreshToken); // Debug log
    
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/users/refresh-token`,
      { refresh_token: refreshToken },
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("Refresh token response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Refresh token failed:", err.response?.data || err.message);
    throw err;
  }
};

export const logoutUser = async () => {
  const res = await axios.post(`${process.env.REACT_APP_API_URL}/users/log-out`);
  return res.data;
};

export const updateUser = async (id, data, access_token) => {
  const res = await axiosJWT.put(
    `${process.env.REACT_APP_API_URL}/users/update-user/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );
  return res.data;
};

export const getUsersByProject = async (projectId, token, page = 1, limit = 20) => {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/get-by-ids`, {
    params: { projectId, page, limit },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
};