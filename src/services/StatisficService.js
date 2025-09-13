import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/households`;

export const getStatusHouseHold = async () => {
  try {
    const res = await axios.get(`${API_URL}/get-status`);
    return res.data;
  } catch (err) {
    console.error("Lỗi getStatusHouseHold:", err);
    throw err;
  }
};

export const getStatusHouseHoldByDay = async (year, month) => {
  const url = `${API_URL}/get-status-by-day?year=${year}&month=${month}`;
  const res = await axios.get(url);
  return res.data;
};


export const getStatusHouseHoldByYear = async (year, month) => {
  try {
    let url = `${API_URL}/get-status-by-year?year=${year}`;
    if (month) {
      url += `&month=${month}`;
    }
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("Lỗi getStatusHouseHoldByYear:", err);
    throw err;
  }
};