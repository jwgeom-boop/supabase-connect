const API_BASE_URL = 'https://banking-coroner-grader.ngrok-free.dev/api'

const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

export const api = {
  getConsultations: async () => {
    const res = await fetch(`${API_BASE_URL}/consultation`, { headers: HEADERS })
    if (!res.ok) throw new Error('데이터 조회 실패')
    return res.json()
  },

  updateConsultation: async (id: string, data: object) => {
    const res = await fetch(`${API_BASE_URL}/consultation/${id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('업데이트 실패')
    return res.json()
  },
}
