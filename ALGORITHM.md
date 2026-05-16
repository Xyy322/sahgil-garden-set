# Landscaping Services Platform - Algorithm Guide

## System Overview
A web-based landscaping services booking platform with user authentication, service booking, shopping cart, and role-based dashboards (Customer & Admin).

---

## 1. User Authentication Flow

```
START
  ├─> Check if user is logged in?
  │   ├─ YES → Redirect to Home/Dashboard
  │   └─ NO → Show Auth Options
  │
  ├─> User selects: Login OR Register
  │
  ├─ LOGIN PATH:
  │   ├─> Input email & password
  │   ├─> Validate credentials with Firebase
  │   ├─> Credentials valid?
  │   │   ├─ YES → Fetch user role (customer/admin)
  │   │   │   └─> Store session & redirect to role-specific dashboard
  │   │   └─ NO → Show error message, retry
  │
  ├─ REGISTER PATH:
  │   ├─> Input: email, password, name, role selection
  │   ├─> Validate inputs (email format, password strength)
  │   ├─> Email already exists?
  │   │   ├─ YES → Show error, retry
  │   │   └─ NO → Create user in Firebase
  │   ├─> Store user profile (name, email, role)
  │   └─> Auto-login user & redirect to dashboard
  │
END
```

---

## 2. Service Browsing & Discovery Flow

```
START (User on Home/Services Page)
  ├─> Load available landscaping services from Firebase
  ├─> Display services with:
  │   ├─ Service name
  │   ├─ Description
  │   ├─ Price
  │   └─ Images
  │
  ├─> User actions:
  │   ├─ View service details → Show full description & pricing tiers
  │   ├─ Add to cart → Update CartContext state
  │   ├─ Filter/Search → Query services
  │   └─ Navigate to other pages
  │
END
```

---

## 3. Booking & Shopping Cart Flow

```
START (User initiates booking)
  ├─> User navigates to "Landscaping Booking" page
  │
  ├─ BOOKING FORM:
  │   ├─> Input details:
  │   │   ├─ Service type selection
  │   │   ├─ Preferred date & time
  │   │   ├─ Property address
  │   │   ├─ Special requirements/notes
  │   │   └─ Quantity/Size options
  │   │
  │   ├─> User clicks "Add to Cart"
  │   │   ├─> Validate all fields
  │   │   ├─ Validation passes?
  │   │   │   ├─ YES → Add booking to CartContext
  │   │   │   │   └─> Show confirmation/success toast
  │   │   │   └─ NO → Display validation errors
  │   │
  │   ├─> User can:
  │   │   ├─ Continue adding more services
  │   │   ├─ View cart icon (item count)
  │   │   └─ Proceed to checkout
  │
END (on user action)
```

---

## 4. Checkout & Payment Flow

```
START (User proceeds to checkout)
  ├─> Cart empty?
  │   ├─ YES → Redirect to Services page with message
  │   └─ NO → Continue
  │
  ├─ CHECKOUT PAGE:
  │   ├─> Display cart items:
  │   │   ├─ Service details
  │   │   ├─ Quantities
  │   │   └─ Subtotal for each item
  │   │
  │   ├─> Show order summary:
  │   │   ├─ Subtotal
  │   │   ├─ Tax (if applicable)
  │   │   ├─ Delivery/Service fee
  │   │   └─ Total amount
  │   │
  │   ├─> Billing information form:
  │   │   ├─ Full name
  │   │   ├─ Email
  │   │   ├─ Phone
  │   │   ├─ Delivery address
  │   │   └─ Special instructions
  │   │
  │   ├─> Payment method selection
  │   │   ├─ Credit/Debit card
  │   │   ├─ Digital wallet (if integrated)
  │   │   └─ Other payment options
  │   │
  │   ├─> User clicks "Place Order"
  │   │   ├─> Validate all fields
  │   │   ├─> Process payment
  │   │   ├─> Payment successful?
  │   │   │   ├─ YES → Create order in Firebase
  │   │   │   │   ├─> Store order details
  │   │   │   │   ├─> Clear cart
  │   │   │   │   ├─> Send confirmation email
  │   │   │   │   └─> Redirect to confirmation page
  │   │   │   └─ NO → Show error message
  │   │   │       └─> Allow user to retry or cancel
  │
END
```

---

## 5. Customer Dashboard Flow

```
START (Customer logged in & on dashboard)
  ├─> Fetch customer's data from Firebase:
  │   ├─ User profile info
  │   ├─ Order history
  │   ├─ Active appointments
  │   └─ Saved preferences
  │
  ├─ DASHBOARD FEATURES:
  │   ├─ PROFILE SECTION:
  │   │   ├─ View personal information
  │   │   ├─> Edit profile → Update Firebase
  │   │   └─> Change password
  │   │
  │   ├─ APPOINTMENTS SECTION:
  │   │   ├─ List all bookings/appointments:
  │   │   │   ├─ Status: Pending, Confirmed, Completed, Cancelled
  │   │   │   ├─ Date, Time, Service type
  │   │   │   └─ Buttons: View Details, Reschedule, Cancel
  │   │   │
  │   │   ├─ Reschedule appointment?
  │   │   │   ├─> Select new date/time
  │   │   │   ├─> Validate availability
  │   │   │   └─> Update in Firebase
  │   │   │
  │   │   ├─ Cancel appointment?
  │   │   │   ├─> Confirm cancellation
  │   │   │   ├─> Check cancellation policy
  │   │   │   └─> Process refund if eligible
  │   │
  │   ├─ ORDER HISTORY SECTION:
  │   │   ├─ Display past orders with filters:
  │   │   │   ├─ Date range filter
  │   │   │   ├─ Status filter (completed, cancelled, etc.)
  │   │   │   └─ Search functionality
  │   │   │
  │   │   ├─> Click on order → View detailed receipt
  │   │   │
  │   │   ├─> Reorder from past purchase?
  │   │   │   └─> Add same services to cart
  │   │
  │   └─ SETTINGS SECTION:
  │       ├─ Notification preferences
  │       ├─ Payment methods
  │       └─ Logout
  │
END
```

---

## 6. Admin Dashboard Flow

```
START (Admin logged in & on dashboard)
  ├─> Fetch admin data from Firebase:
  │   ├─ All customer appointments
  │   ├─ Order management data
  │   ├─ Service inventory
  │   └─ Analytics/Reports
  │
  ├─ ADMIN FEATURES:
  │   ├─ APPOINTMENT MANAGEMENT:
  │   │   ├─ View all appointments (filtered by status)
  │   │   ├─ Search appointments by:
  │   │   │   ├─ Customer name/email
  │   │   │   ├─ Date range
  │   │   │   └─ Service type
  │   │   │
  │   │   ├─> Click appointment → View full details
  │   │   │   ├─ Customer info
  │   │   │   ├─ Service details
  │   │   │   ├─ Assigned worker (if any)
  │   │   │   └─ Status & notes
  │   │   │
  │   │   ├─ Update appointment status:
  │   │   │   ├─ Pending → Confirmed
  │   │   │   ├─ Confirmed → In Progress
  │   │   │   ├─ In Progress → Completed
  │   │   │   └─ Any → Cancelled (with reason)
  │   │   │
  │   │   ├─ Add notes/updates → Firebase
  │   │   ├─> Assign worker to appointment
  │   │   └─> Send notification to customer
  │   │
  │   ├─ ORDER MANAGEMENT:
  │   │   ├─ View all orders with stats
  │   │   ├─ Filter by: Date, Status, Customer
  │   │   ├─> Refund order?
  │   │   │   ├─ Validate refund eligibility
  │   │   │   ├─ Process refund
  │   │   │   └─> Update order status
  │   │   └─> Export order data
  │   │
  │   ├─ SERVICE/INVENTORY MANAGEMENT:
  │   │   ├─ View available services
  │   │   ├─> Add new service
  │   │   │   ├─ Input: name, description, price, images
  │   │   │   └─> Save to Firebase
  │   │   │
  │   │   ├─> Edit existing service
  │   │   │   ├─ Update pricing
  │   │   │   ├─ Update availability
  │   │   │   └─ Update images/description
  │   │   │
  │   │   └─> Deactivate/Delete service
  │   │
  │   ├─ ANALYTICS/REPORTS:
  │   │   ├─ Total orders/revenue (by date range)
  │   │   ├─ Popular services
  │   │   ├─ Customer statistics
  │   │   ├─ Appointment completion rate
  │   │   └─> Export reports
  │   │
  │   └─ ADMIN SETTINGS:
  │       ├─ System configuration
  │       ├─ Staff management
  │       └─ Logout
  │
END
```

---

## 7. Role-Based Access Control Flow

```
START (User attempts to access protected route)
  ├─> Check if user is authenticated?
  │   ├─ NO → Redirect to Login page
  │   └─ YES → Continue
  │
  ├─> Fetch user role from Firebase
  │
  ├─> Is user role allowed for this route?
  │   ├─ Customer accessing /dashboard/customer?
  │   │   └─ YES → Allow access to Customer Dashboard
  │   │
  │   ├─ Admin accessing /dashboard/admin?
  │   │   └─ YES → Allow access to Admin Dashboard
  │   │
  │   └─ NO → Redirect to 403 Unauthorized or Home
  │
END
```

---

## 8. Data Flow with Firebase

```
START (Any operation requiring data persistence)
  ├─> WRITE OPERATIONS:
  │   ├─ Validate data locally
  │   ├─> Call Firebase function (set, mset, add document)
  │   ├─> Operation successful?
  │   │   ├─ YES → Update UI state
  │   │   │   └─> Show success message
  │   │   └─ NO → Show error message
  │   │       └─> Possibly retry
  │
  ├─> READ OPERATIONS:
  │   ├─ Query Firebase (get, getByPrefix, mget)
  │   ├─> Data received?
  │   │   ├─ YES → Update component state
  │   │   └─ NO → Show empty state or error
  │
  ├─> DELETE OPERATIONS:
  │   ├─ Confirm deletion with user
  │   ├─> Call Firebase delete function
  │   ├─> Operation successful?
  │   │   ├─ YES → Remove from UI
  │   │   └─ NO → Show error
  │
END
```

---

## Key Algorithm Principles

1. **Authentication First**: All protected routes validate user role before rendering
2. **Cart Management**: Uses React Context to manage shopping cart state across pages
3. **Firebase Integration**: All data persistence uses Firestore with key-value store pattern
4. **Error Handling**: All operations catch errors and display user-friendly messages
5. **Validation**: Input validation happens client-side before Firebase operations
6. **Role-Based Access**: Different UI and features shown based on user role
7. **State Management**: CartContext + React Router handle navigation and state

---

## Common User Journeys

### Journey 1: New Customer Booking
```
Register → Browse Services → Add to Cart → Checkout → Complete Order → View in Dashboard
```

### Journey 2: Existing Customer Repeat Booking
```
Login → View past orders → Reorder → Checkout → Track in Appointments
```

### Journey 3: Admin Managing Appointments
```
Login (Admin) → View all appointments → Update status → Assign worker → Send notification → Track completion
```

### Journey 4: Customer Rescheduling
```
Login → Go to Dashboard → Select appointment → Reschedule → Confirm new time → Receive confirmation
```
