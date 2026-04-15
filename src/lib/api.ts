const API_BASE_URL = 'https://banking-coroner-grader.ngrok-free.dev/api'

export const api = {
  getConsultations: async () => {
    const res = await fetch(`${API_BASE_URL}/consultation`)
    if (!res.ok) throw new Error('데이터 조회 실패')
    return res.json()
  },

  updateConsultation: async (id: string, data: object) => {
    const res = await fetch(`${API_BASE_URL}/consultation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('업데이트 실패')
    return res.json()
  },
}
