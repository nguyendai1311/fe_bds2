import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  access_token: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Cập nhật thông tin người dùng
    updateUser: (state, action) => {
      const payload = action.payload;

      // Chuẩn hóa roles: convert từ object -> string
      const normalizedRoles = payload.roles?.map((r) =>
        typeof r === "string" ? r.toLowerCase() : r.role?.toLowerCase()
      );

      state.user = {
        ...payload,
        roles: normalizedRoles || [],
      };

      state.access_token = payload.access_token || "";
    },

    // Reset về mặc định
    resetUser: (state) => {
      state.user = null;
      state.access_token = "";
    },
  },
});

export const { updateUser, resetUser } = userSlice.actions;
export default userSlice.reducer;
