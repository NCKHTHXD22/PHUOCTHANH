import axios from 'axios'

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api/cat-dien',
})

// Đơn vị điện lực phụ trách Phước Thành (Điện lực Hiệp Đức)
export const DON_VI = 'PC05HH'
