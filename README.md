# Sahgil Garden Set — Web-Based Landscaping & Garden Furniture Platform

A full-stack web application for Sahgil Garden Set that allows customers to browse and order garden furniture, book landscaping consultation appointments, and communicate with admins through a real-time chat system.

---

## 🌿 System Overview

This platform serves two types of users:

- **Customers** — can browse products, place orders, book landscaping appointments, track order status, and send inquiries via live chat.
- **Admins** — can manage products, process orders, approve or reject appointments, and respond to customer inquiries — all from a dedicated admin dashboard.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Backend & Database | Firebase Firestore (NoSQL, real-time) |
| Authentication | Firebase Authentication |
| File Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Build Tool | Vite |
| Animations | Framer Motion |

---

## ✨ Features

### Customer
- Register and log in securely with role-based access
- Browse garden furniture products by category
- Add products to cart and place orders with delivery details
- Book landscaping consultation appointments with real-time availability checking
- Track order status (Pending → Processing → Shipped → Delivered)
- View and manage appointments from personal dashboard
- Send and receive messages through the live inquiry/chat system
- Receive real-time notifications for order and appointment updates
- Edit profile and change password

### Admin
- Dedicated admin dashboard with sales analytics (charts)
- Manage products — add, edit, delete, upload images
- View and update order statuses in real time
- Approve, reject, or complete appointment bookings
- Respond to customer inquiries via the chat system
- Real-time notifications for new orders and appointments

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or pnpm
- A Firebase project (Firestore, Auth, and Storage enabled)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Xyy322/saghil-garden-set.git
cd sahgil-garden-set
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

4. Start the development server:
```bash
npm run dev
```

5. Open `http://localhost:5173` in your browser.

---

## 🔐 User Roles

| Role | How to Set |
|---|---|
| Customer | Default role assigned on registration |
| Admin | Manually set `role: "admin"` in Firestore under the `users` collection for that user's UID |

---

## 📁 Project Structure

src/
├── app/
│   ├── components/        # Shared components (Root, Cart, Chat, Notifications, UI)
│   ├── hooks/             # Custom hooks (useInquiryChat, useNotifications)
│   ├── pages/             # All page components (Home, Services, Dashboard, Admin, etc.)
│   └── routes.tsx         # App routing configuration
├── assets/                # Static assets (logo, images)
├── styles/                # Global styles and theme tokens
├── types/                 # TypeScript type definitions
└── utils/
├── firebase/          # Firebase config, error mapper, image upload
├── appointmentUtils.ts
├── createNotification.ts
└── dateUtils.ts

---

## 🌐 Deployment

This project is deployed on Firebase Hosting.

To deploy:
```bash
npm run build
firebase deploy
```

---

## ⚠️ Known Limitations

- No real payment gateway integration — orders currently use cash on delivery only
- No automated email notifications — status updates are in-app only
- Landscaping services are limited to a single service type (consultation)
- No admin account self-registration — admin roles must be set manually in Firestore

---

## 👥 Authors

Developed as a capstone project for [Your Course Name] at [Your School Name].

| Name | Role |
|---|---|
| [Villena, Xyriz A.] | Full-stack Developer |
| [Gregorio, Jhono Rhancell G.] | [Role] |
| [Paulite, Emerson P.] | [Role] |

---

## 📄 License

This project is for academic purposes only.