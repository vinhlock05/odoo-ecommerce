'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyVnpayReturn, formatPrice } from '@/lib/api'

interface PaymentResult {
  success: boolean
  txn_ref: string
  order_id: number | null
  order_name?: string
  amount?: number
  message: string
}

export default function VnpayResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => { params[key] = value })

    verifyVnpayReturn(params)
      .then((res) => {
        if (res.success) setResult(res.data)
        else setResult({ success: false, txn_ref: '', order_id: null, message: 'Không thể xác thực thanh toán' })
      })
      .catch(() => setResult({ success: false, txn_ref: '', order_id: null, message: 'Lỗi kết nối' }))
      .finally(() => setLoading(false))
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {result?.success ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-500 mb-6">{result.message}</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-8 text-sm">
              {result.order_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Đơn hàng</span>
                  <span className="font-semibold text-gray-900">{result.order_name}</span>
                </div>
              )}
              {result.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Số tiền</span>
                  <span className="font-semibold text-gray-900">{formatPrice(result.amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Mã giao dịch</span>
                <span className="font-mono text-xs text-gray-700">{result.txn_ref}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/account')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Xem đơn hàng
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-500 mb-8">{result?.message ?? 'Thanh toán không thành công. Vui lòng thử lại.'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={() => router.push('/cart')}
                className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Về giỏ hàng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
