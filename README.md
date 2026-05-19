# Sahgil Garden Set — Web-Based Appointment Scheduling and Ordering System 🌿🪑

A web-based capstone system for Sahgil Garden Set that allows customers to browse and order garden furniture products, submit landscaping consultation appointment requests, send inquiries, submit customer reviews, and receive order and appointment status updates.

---

## 🌿 System Overview

This platform serves two types of users:

- **Customers** — can browse products, place orders, submit landscaping appointment requests, track order and appointment status, send inquiries, submit reviews with star ratings, receive notifications, and manage their profile.
- **Admins** — can manage products, process orders, confirm delivery fees, update order statuses, approve or reject appointment requests, view customer inquiries, manage customer records, moderate customer reviews, and generate reports from a dedicated admin dashboard.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 + Radix UI |
| Backend & Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| File Storage | Firebase Storage |
| Hosting | Firebase Hosting-ready |
| Build Tool | Vite |
| Animations | Framer Motion |
| Charts | Recharts |
| Notifications | Sonner + In-System Notifications |

---

## ✨ Features

### Customer
- Register and log in securely with role-based access
- Browse garden furniture products
- Add products to cart and place orders with delivery details
- Track order status from the customer dashboard
- View product subtotal, delivery fee, and final total after admin confirmation
- Submit landscaping consultation appointment requests
- View and manage appointment requests from personal dashboard
- Cancel pending appointment requests only
- Send inquiries to the business
- Submit customer reviews with star ratings
- Choose whether to submit a review anonymously or with a display name
- Reviews are sent for admin approval before appearing on the homepage
- Receive in-system notifications for order and appointment updates
- View and update profile information

### Admin
- Dedicated admin dashboard with operational summaries and charts
- Manage products — add, edit, delete, and upload images
- View and update order statuses in real time
- Confirm delivery fee based on customer location
- Automatically compute final order total after delivery fee confirmation
- Approve, reject, or complete appointment requests
- View customer appointment details and reserved dates
- View and manage customer inquiries
- Manage customer review submissions
- Approve or decline submitted reviews before they appear publicly
- View customer records
- Generate daily and monthly reports for monitoring operations
- Receive in-system notifications for new orders, appointments, and inquiries

---

## ⭐ Review and Rating System

The system includes a moderated customer review feature.

Customers and visitors can submit reviews with a star rating and a short message. They may choose to display their name or submit the review anonymously. Submitted reviews do not appear immediately on the homepage.

Review flow:

```text
Customer submits review
→ Review is saved as pending
→ Admin reviews the submission
→ Admin approves or declines the review
→ Only approved reviews appear on the homepage

This helps the business maintain professional and appropriate public feedback while still allowing customers to share their experience.

🚀 Getting Started
Prerequisites
Node.js v18 or higher
npm
A Firebase project with Authentication, Firestore, and Storage enabled
Firebase CLI if deploying rules or hosting

Installation
Clone the repository:
git clone https://github.com/Xyy322/sahgil-garden-set.git
cd sahgil-garden-set

Install dependencies:

npm install
or
npm ci

Create a .env file in the project root:
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

Start the development server:
npm run dev

Open http://localhost:5173 in your browser.

🔐 User Roles
Role	     ||     How to Set

Customer	 ||     Default role assigned on registration

Admin	     ||     Manually set role: "admin" in Firestore under the

                    users collection for that user's UID

📁 Project Structure
src/
├── app/
│   ├── components/        # Shared components, layouts, cart, notifications, reviews, and UI
│   ├── context/           # Authentication context
│   ├── pages/             # Public, customer, and admin pages
│   └── routes.tsx         # App routing configuration
├── assets/                # Static assets such as logo and images
├── styles/                # Global styles and theme tokens
├── types/                 # TypeScript type definitions
└── utils/
    ├── firebase/          # Firebase config, rules, error mapper, image upload
    ├── appointmentUtils.ts
    ├── createNotification.ts
    └── dateUtils.ts

🗂️ Firebase Collections
users
products
orders
appointments
appointmentLocks
inquiries
reviews
notifications

Collection ||	Purpose
users ||	Stores customer/admin profile and role information
products ||	Stores product catalog records
orders ||	Stores customer orders, product subtotal, delivery fee, final total, and order status
appointments ||	Stores landscaping consultation appointment requests
appointmentLocks ||	Stores reserved appointment dates to help prevent duplicate booking
inquiries ||	Stores customer inquiry submissions
reviews ||	Stores customer review submissions, star ratings, approval status, and display name settings
notifications ||	Stores admin and customer notifications

🌐 Deployment

This project is Firebase Hosting-ready.

To build:
npm run build

To deploy Firestore rules:
firebase deploy --only firestore:rules

To deploy the full Firebase project, if hosting is configured:
firebase deploy

🛡️ Security Notes
Role-based access is used to separate customer and admin pages
Customers can only access their own orders, appointments, profile, inquiries, and notifications
Admin-only pages are protected through role-based route guarding
Customers can only create orders with pending status
Delivery fee and final total are controlled by the admin
Customers can only cancel appointment requests while they are still pending
Customers and visitors can only create pending reviews
Public users can only view approved reviews
Admins can approve or decline submitted reviews
Firestore Security Rules are used to restrict database access

⚠️ Known Limitations
No real payment gateway integration — orders currently use cash on delivery only
No automated email notifications — status updates are in-app only
Landscaping services are limited to consultation appointment requests
No admin account self-registration — admin roles must be set manually in Firestore
No full two-way live chat system — inquiries can be submitted and managed, but admin replies are not implemented as a complete chat module
Custom orders are handled through inquiries or direct customer communication, not as a separate custom-order checkout module
Reviews require admin approval before being displayed publicly
The review system does not include replies, editing, or image reviews
Some deeper business validations may require Firebase Cloud Functions for stronger server-side enforcement

👥 Authors

Developed as a capstone project for the Bachelor of Science in Information Technology program at St. Louis Anne College of San Pedro, Laguna.

| Name                        | Role                   |
| --------------------------- | ---------------------- |
| Villena, Xyriz A.           | Researcher / Developer |
| Gregorio, Jhono Rhancell G. | Researcher / Developer |
| Paulite, Emerson P.         | Researcher / Developer |

📄 License

This project is for academic purposes only.


After replacing, run:

```powershell
npm run typecheck
npm run build