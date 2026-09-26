const API_URL = import.meta.env.VITE_API_URL || ''

export const apiUrl = (path: string) => {
  return `${API_URL}${path}`
}