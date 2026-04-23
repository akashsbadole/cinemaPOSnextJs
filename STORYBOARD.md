# 🖼️ CinePOS Feature Walkthrough - Storyboard

| Scene | Duration | Visual Action | Feature Highlighted |
|-------|----------|---------------|----------------------|
| **1. Intro** | 20s | Open `localhost:3000`. Show the Hero image and logo. | Branding & UI Design |
| **2. Login** | 30s | Click 'Quick Login: Admin'. Show the Sidebar sliding in. | Auth & JWT Sessions |
| **3. Inventory** | 45s | Go to 'Movies'. Click 'Add Movie'. Fill dummy data. | Movie CRUD |
| **4. Scheduling**| 45s | Go to 'Shows'. Click 'Schedule Show'. Select Movie, Screen, and Time. | Conflict Detection |
| **5. POS Flow** | 60s | Go to 'POS'. Select the show just created. Click 3 seats. | Seat Map & Real-time Locking |
| **6. Checkout** | 30s | Apply coupon `FIRST50`. Enter 'John Doe' as customer. | Coupons & Payments |
| **7. Receipt** | 15s | Click 'Book Ticket'. Show the HTML Receipt with QR Code. | Ticket Generation |
| **8. Dashboard**| 30s | Go to 'Analytics'. Toggle between 7D and 30D views. | Recharts Integration |
| **9. Management**| 30s | Go to 'Staff'. Show the list of users and their roles. | RBAC |
| **10. Outro** | 15s | Log out. Show the login screen again with 'CinePOS' logo. | Native Desktop (Tauri) |

---

## 🎬 Key Interactions to Capture

1. **The Hover Effect**: Show how the seat map reacts to mouse-over (displaying seat numbers and prices).
2. **The Countdown**: Zoom in on the 5-minute lock timer when seats are selected.
3. **The Chart Animation**: Show the Recharts bars and lines animating when the Analytics page loads.
4. **Responsive Switch**: Briefly resize the window to show how the sidebar collapses into a hamburger menu.
5. **Print Preview**: Open the ticket and show the layout, emphasizing the QR code and branding.

---

## 🎵 Audio Direction
- **Background Music**: Professional, upbeat, corporate-tech style. Low volume during narration.
- **Voiceover**: Professional, clear, and welcoming.
- **Sound Effects**: Subtle "click" sounds on button presses, a "success" chime on booking completion.
