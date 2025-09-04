import { jwtDecode } from "jwt-decode"
import React, { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useDispatch } from "react-redux"
import * as UserService from "../../../services/UserService"
import { useMutationHooks } from "../../../hooks/useMutationHooks"
import { updateUser } from "../../../redux/slices/userSlice"
import InputForm from "../../../components/InputForm/InputForm"
import ButtonComponent from "../../../components/ButtonComponent/ButtonComponent"
import { EyeFilled, EyeInvisibleFilled } from "@ant-design/icons"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const SignInPages = () => {
  const [isShowPassword, setIsShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  // mutation login
  const mutation = useMutationHooks((data) => UserService.loginUser(data))
  const { data, isSuccess, isError, error, isLoading } = mutation

  // Khi login thành công
  useEffect(() => {
    if (isSuccess && data?.access_token) {
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)

      const decoded = jwtDecode(data.access_token)
      if (decoded?.id) handleGetDetailsUser(decoded.id, data.access_token)
    }

    if (isError) {
      const errorMessage =
        error?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!"
      toast.error(errorMessage)
    }
  }, [isSuccess, isError, error])

  // Lấy thông tin user sau khi login
  const handleGetDetailsUser = async (id, token) => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      const res = await UserService.getDetailsUser(id, token)
      const userData = res?.data

      let role = "employee"
      if (userData.roles?.includes("admin")) role = "admin"

      const userObj = { ...userData, role, access_token: token, refresh_token: refreshToken }
      localStorage.setItem("user", JSON.stringify(userObj))
      dispatch(updateUser(userObj))

      toast.success("Đăng nhập thành công!")

      if (role === "admin") {
        navigate("/system/admin", { replace: true })
      } else {
        const redirectPath = location.state?.from || "/"
        navigate(redirectPath, { replace: true })
      }
    } catch (err) {
      toast.error("Không thể lấy thông tin người dùng.")
    }
  }

  // Submit login
  const handleSignIn = () => {
    if (!email || !password) {
      toast.warning("Vui lòng nhập đầy đủ email và mật khẩu!")
      return
    }
    mutation.mutate({ email, password })
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen 
      bg-gradient-to-br from-blue-100 to-blue-300">
      
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-4xl 
        shadow-xl rounded-2xl overflow-hidden bg-white">
        
        {/* Left side */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 
          bg-gradient-to-br from-blue-500 to-blue-700 p-8 text-white">
          <img
            src="https://qlvb.tphcm.gov.vn/qlvbdh/login/img/logo-header.png"
            alt="logo"
            className="w-28 h-28 mb-4"
          />
          <h1 className="font-bold text-2xl text-center">
            HỆ THỐNG QUẢN LÝ LƯU TRỮ VÀ ĐIỀU HÀNH
          </h1>
          <p className="text-blue-100 text-center mt-2">
            BAN BỒI THƯỜNG GIẢI PHÓNG MẶT BẰNG
          </p>
        </div>

        {/* Right side */}
        <div className="w-full md:w-1/2 p-10 bg-white flex flex-col justify-center">
          <h2 className="text-center text-blue-700 font-bold text-xl mb-6">
            Hệ thống Quản lý văn bản dùng chung
          </h2>

          <InputForm
            placeholder="Email"
            value={email}
            onChange={setEmail}
            className="w-full mb-4"
          />

          <div className="relative mb-4">
            <InputForm
              placeholder="Mật khẩu"
              type={isShowPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              className="w-full pr-10"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setIsShowPassword((prev) => !prev)}
            >
              {isShowPassword ? <EyeFilled /> : <EyeInvisibleFilled />}
            </span>
          </div>

          <ButtonComponent
            onClick={handleSignIn}
            disabled={isLoading}
            textbutton={isLoading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
            styleButton={{
              background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
              color: "#fff",
              height: "45px",
              width: "100%",
              borderRadius: "8px",
              margin: "10px 0",
              fontWeight: "bold",
            }}
          />

          <p
            className="text-right text-sm text-blue-600 cursor-pointer hover:underline mt-2"
            onClick={() => navigate("/forgot-password")}
          >
            Quên mật khẩu?
          </p>

          <div className="mt-6 flex justify-center">
            <img
              src="https://tse3.mm.bing.net/th/id/OIP.lxAO0eMBFUURmBT_aRL_IwHaHa?cb=ucfimg2ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3"
              alt="SSO"
              className="w-20 h-20 opacity-90"
            />
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default SignInPages
