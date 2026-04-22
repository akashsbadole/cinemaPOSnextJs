// lib/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SeatItem {
  id: string
  row: string
  number: number
  type: 'VIP' | 'PREMIUM' | 'REGULAR'
  price: number
  label: string
}

export interface BookingState {
  // Booking flow
  selectedShow: any | null
  selectedSeats: SeatItem[]
  couponCode: string
  couponDiscount: number
  customerName: string
  customerPhone: string
  customerEmail: string
  paymentMethod: string
  sessionId: string

  // UI state
  lockTimer: number
  lockActive: boolean

  // Actions
  setShow: (show: any) => void
  addSeat: (seat: SeatItem) => void
  removeSeat: (seatId: string) => void
  clearSeats: () => void
  setCoupon: (code: string, discount: number) => void
  clearCoupon: () => void
  setCustomer: (name: string, phone: string, email: string) => void
  setPaymentMethod: (method: string) => void
  setLockTimer: (seconds: number) => void
  setLockActive: (active: boolean) => void
  clearBooking: () => void

  // Computed
  getTotal: () => number
  getFinalAmount: () => number
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      selectedShow: null,
      selectedSeats: [],
      couponCode: '',
      couponDiscount: 0,
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      paymentMethod: 'CASH',
      sessionId: typeof window !== 'undefined' ? (localStorage.getItem('cinepos-session') || Math.random().toString(36).slice(2)) : '',
      lockTimer: 300,
      lockActive: false,

      setShow: (show) => set({ selectedShow: show, selectedSeats: [], lockActive: false, lockTimer: 300 }),
      addSeat: (seat) => set((s) => ({
        selectedSeats: [...s.selectedSeats, seat],
        lockActive: true,
        lockTimer: 300,
      })),
      removeSeat: (seatId) => set((s) => ({
        selectedSeats: s.selectedSeats.filter(seat => seat.id !== seatId),
        lockActive: s.selectedSeats.length > 1,
      })),
      clearSeats: () => set({ selectedSeats: [], lockActive: false, lockTimer: 300 }),
      setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      clearCoupon: () => set({ couponCode: '', couponDiscount: 0 }),
      setCustomer: (name, phone, email) => set({ customerName: name, customerPhone: phone, customerEmail: email }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setLockTimer: (seconds) => set({ lockTimer: seconds }),
      setLockActive: (active) => set({ lockActive: active }),
      clearBooking: () => set({
        selectedShow: null, selectedSeats: [], couponCode: '', couponDiscount: 0,
        customerName: '', customerPhone: '', customerEmail: '',
        paymentMethod: 'CASH', lockActive: false, lockTimer: 300,
      }),

      getTotal: () => get().selectedSeats.reduce((sum, s) => sum + s.price, 0),
      getFinalAmount: () => {
        const total = get().selectedSeats.reduce((sum, s) => sum + s.price, 0)
        return Math.max(0, total - get().couponDiscount)
      },
    }),
    { name: 'cinepos-booking', partialize: (s) => ({ sessionId: s.sessionId }) }
  )
)

// UI store
interface UIState {
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (t: 'dark' | 'light') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'cinepos-ui' }
  )
)
