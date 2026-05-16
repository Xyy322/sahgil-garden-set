// CustomerDashboard is the main user interface for customers to view their orders, appointments, and manage their cart.
// It directly affects the system by displaying user-specific data, allowing order tracking, and providing access to appointment details.
// This file integrates with Firebase for real-time data and authentication, and uses several utility and UI components.
import { Package, Calendar, Clock, MapPin, Search, ChevronDown, ChevronUp, Truck, CheckCircle, Package as PackageIcon, CreditCard, AlertCircle, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { db } from "../../utils/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useCart } from "../components/CartContext";
import { Cart } from "../components/Cart";
import { Appointment, formatTime, formatDisplayDate } from "../../utils/appointmentUtils";
import { ChatBubble } from "../components/chat/ChatBubble";
import { Timestamp } from "firebase/firestore";
import { createNotification } from "../../utils/createNotification";

// Order type defines the structure of an order for display and management.
type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
  };
  total: number;
  status: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  createdAt: { toDate?: () => Date } | null;
};

// ORDER_STEPS defines the steps in the order lifecycle for progress tracking.
const ORDER_STEPS = [
  { key: 'Pending', label: 'Order Placed', icon: PackageIcon },
  { key: 'Processing', label: 'Processing', icon: PackageIcon },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle },
];

// Returns the index of the current order status step for progress display.
function getStatusStep(status: string): number {
  const index = ORDER_STEPS.findIndex(s => s.key.toLowerCase() === status?.toLowerCase());
  return index >= 0 ? index : 0;
}

// Main customer dashboard component.
// Handles authentication, data fetching, and state for orders and appointments.
export function CustomerDashboard() {
  // Access addItem to allow reordering or cart actions from dashboard.
  const { addItem } = useCart();
  const navigate = useNavigate();
  // User state for authentication and personalization.
  const [user, setUser] = useState<User | null>(null);
  // Orders and appointments state for display.
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Loading states for async data.
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  // UI state for expanded/collapsed order and appointment details.
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);

  // On mount, check authentication and redirect if not logged in.
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setUser(user);
      }
    });
    return () => unsub();
  }, [navigate]);

  // Fetch orders from Firestore for the logged-in user.
  // This keeps the dashboard up to date with the user's order history.
  useEffect(() => {
    if (!user?.email) return;

    const fetchOrders = async () => {
      try {
        const ordersRef = collection(db, "orders");
        // Query orders by customer email. (No orderBy to avoid Firestore index requirements.)
        const q = query(
          ordersRef,
          where("customerEmail", "==", user.email)
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedOrders.push({
            id: doc.id,
            customerName: data.customerName || '',
            customerEmail: data.customerEmail || '',
            customerPhone: data.customerPhone || '',
            shippingAddress: data.shippingAddress || { street: '', city: '', postalCode: '' },
            total: data.total || 0,
            status: data.status || 'Pending',
            paymentMethod: data.paymentMethod || 'Cash on Delivery',
            items: data.items || [],
            createdAt: data.createdAt,
          } as Order);
        });
        
        // Sort by createdAt on client side (newest first)
        fetchedOrders.sort((a, b) => {
          if (a.createdAt?.toDate && b.createdAt?.toDate) {
            return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
          }
          return 0;
        });
        
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user?.email]);

  // Fetch appointments from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const fetchAppointments = async () => {
      try {
        const appointmentsRef = collection(db, "appointments");
        const q = query(
          appointmentsRef,
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedAppointments: Appointment[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedAppointments.push({
            id: doc.id,
            ...data,
          } as Appointment);
        });
        
        // Sort by appointmentDate (newest first)
        fetchedAppointments.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setAppointments(fetchedAppointments);
        } catch (error) {
          console.error("Error fetching appointments:", error);
        } finally {
          setLoadingAppointments(false);
        }
      };


    fetchAppointments();
  }, [user?.uid]);

  const userName = user?.email ? user.email.split('@')[0] : 'Jane';

  return (
    <div className="bg-[#f9f7f4] min-h-screen py-12 relative z-0">
      <ChatBubble />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Welcome back, {userName}!</h1>
            <p className="text-stone-600 mt-1">Manage your orders and landscaping appointments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Recent Furniture Orders
                </h2>
                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</a>
              </div>

              <div className="space-y-5">
                {loadingOrders ? (
                  <div className="text-center py-8 text-stone-500">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">No orders yet. Start shopping to see your orders here!</div>
                ) : (
                  orders.slice(0, 5).map((order) => {
                    const currentStep = getStatusStep(order.status || 'Pending');
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <div key={order.id} className="rounded-2xl border border-stone-100 bg-white overflow-hidden transition-shadow hover:shadow-md">
                        {/* Order Header - Always Visible */}
                        <button
                          type="button"
                          className="flex flex-col sm:flex-row gap-4 p-4 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer hover:bg-stone-50 transition-colors"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`order-details-${order.id}`}
                        >
                          <div className="w-full sm:w-24 h-24 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {order.items[0]?.image ? (
                              <img src={order.items[0].image} alt={order.items[0].name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-8 h-8 text-stone-400" />
                            )}
                          </div>
                          <div className="flex-grow flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h3 className="font-bold text-stone-800">{order.items[0]?.name || 'Order'}{order.items.length > 1 && ` +${order.items.length - 1} more`}</h3>
                                <p className="text-sm text-stone-500 mt-1">
                                  Order #{order.id.slice(0, 8).toUpperCase()} • {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                  order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  order.status === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-stone-100 text-stone-700 border-stone-200'
                                }`}>
                                  {order.status || 'Pending'}
                                </span>
                                {isExpanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" /> }
                              </div>
                            </div>
                            <div className="flex justify-between items-end mt-4 sm:mt-0">
                              <span className="font-bold text-stone-800">₱{order.total?.toFixed(2) || '0.00'}</span>
                              <span className="text-sm text-stone-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </button>

                        {/* Expanded Order Details */}
                        {isExpanded && (
                          <div id={`order-details-${order.id}`} className="border-t border-stone-100 p-4 bg-stone-50 animate-fade-in">
                            {/* Order Tracking Progress */}
                            <div className="mb-6">
                              <h4 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Order Tracking
                              </h4>
                              <div className="overflow-x-auto pb-2">
                                <div className="flex items-center justify-between min-w-[400px]">
                                  {ORDER_STEPS.map((step, index) => {
                                    const StepIcon = step.icon;
                                    const isCompleted = index <= currentStep;
                                    const isCurrent = index === currentStep;
                                    return (
                                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                                        {/* Connector Line */}
                                        {index > 0 && (
                                          <div className={`absolute top-4 sm:top-5 -left-1/2 w-full h-0.5 ${index <= currentStep ? 'bg-emerald-500' : 'bg-stone-200'}`} />
                                        )}
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 ${
                                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'
                                        }`}>
                                          <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <span className={`text-xs mt-2 text-center ${isCurrent ? 'font-bold text-emerald-600' : isCompleted ? 'text-stone-600' : 'text-stone-400'}`}>
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Order Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Shipping Address */}
                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  Shipping Address
                                </h4>
                                <p className="text-sm text-stone-600">
                                  {order.customerName}<br />
                                  {order.shippingAddress?.street}<br />
                                  {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                                </p>
                              </div>

                              {/* Payment Method */}
                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  Payment Method
                                </h4>
                                <p className="text-sm text-stone-600">
                                  {order.paymentMethod || 'Cash on Delivery'}
                                </p>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="mt-4 bg-white p-4 rounded-xl">
                              <h4 className="font-bold text-stone-800 mb-3">Order Items</h4>
                              <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {item.image && (
                                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                      )}
                                      <div>
                                        <p className="font-medium text-stone-800">{item.name}</p>
                                        <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addItem({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 });
                                        }}
                                        className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded hover:bg-emerald-200 transition-colors"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                                <span className="font-bold text-stone-800">Total</span>
                                <span className="font-bold text-lg text-emerald-600">${order.total?.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Landscaping Appointments
                </h2>
                <button 
                  onClick={() => navigate("/landscaping/booking")}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Book New
                </button>
              </div>

              {loadingAppointments ? (
                <div className="text-center py-8 text-stone-500">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-center">
                  <Leaf className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                  <p className="text-stone-700 font-medium mb-2">No appointments scheduled</p>
                  <p className="text-stone-600 text-sm mb-4">
                    Book your landscaping consultation to get started
                  </p>
                  <button 
                    onClick={() => navigate("/landscaping/booking")}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Schedule Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => {
                    const isExpanded = expandedAppointment === apt.id;
                    const date = new Date(apt.date + "T00:00:00Z");
                    const statusColors = {
                      pending: "bg-amber-50 text-amber-700 border-amber-200",
                      approved: "bg-blue-50 text-blue-700 border-blue-200",
                      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      rejected: "bg-red-50 text-red-700 border-red-200",
                      cancelled: "bg-stone-100 text-stone-700 border-stone-200",
                    };
                    
                    return (
                      <div key={apt.id} className="rounded-2xl border border-stone-100 overflow-hidden">
                        <div 
                          className="flex flex-col sm:flex-row gap-4 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
                          onClick={() => setExpandedAppointment(isExpanded ? null : apt.id)}
                        >
                          <div className="w-full sm:w-20 h-20 bg-emerald-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div className="flex-grow flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-stone-800">Landscaping Consultation</h3>
                                <p className="text-sm text-stone-500 mt-1">
                                  {formatDisplayDate(apt.date)} at {formatTime(apt.time)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                  statusColors[apt.status as keyof typeof statusColors] || statusColors.pending
                                }`}>
                                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </span>
                                {isExpanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" /> }
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-stone-100 p-4 bg-stone-50">
                            {apt.status === "pending" && (
                              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-amber-800">Pending Approval</p>
                                  <p className="text-xs text-amber-700">The admin will review and confirm your appointment within 24 hours</p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2">Appointment Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-stone-600">Date:</span>
                                    <span className="font-medium text-stone-800">{formatDisplayDate(apt.date)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-stone-600">Time:</span>
                                    <span className="font-medium text-stone-800">{formatTime(apt.time)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-stone-600">Type:</span>
                                    <span className="font-medium text-stone-800">Consultation</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2">Your Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-stone-600">
                                    {apt.customerName}
                                  </div>
                                  <div className="flex items-center gap-2 text-stone-600">
                                    {apt.customerEmail}
                                  </div>
                                  <div className="flex items-center gap-2 text-stone-600">
                                    {apt.customerPhone}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {apt.description && (
                              <div className="mt-4 bg-white p-4 rounded-xl">
                                <h4 className="font-bold text-stone-800 mb-2">Project Description</h4>
                                <p className="text-sm text-stone-600">{apt.description}</p>
                              </div>
                            )}

                            <div className="mt-4 flex gap-2">
                              {apt.status === "pending" && (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (apt.status === "cancelled") return;
                                    if (confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
                                      await updateDoc(doc(db, 'appointments', apt.id), {
                                        status: 'cancelled',
                                        updatedAt: Timestamp.now()
                                      });

                                      if (user?.uid) {
                                        await createNotification({
                                          userId: user.uid,
                                          title: "Appointment Update",
                                          message: "Your appointment is now cancelled",
                                          type: "appointment",
                                          statusRefId: apt.id,
                                        });
                                      }

                                      setExpandedAppointment(null);
                                    }
                                  }}
                                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <Cart />
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
              <h3 className="font-bold text-stone-800 mb-4">Account Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">Total Orders</span>
                  <span className="font-bold text-stone-800">{orders.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">Active Consultations</span>
                  <span className="font-bold text-stone-800">
                    {appointments.filter(a => a.status === "approved" || a.status === "pending").length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-stone-100">
                  <span className="text-stone-600">Completed Consultations</span>
                  <span className="font-bold text-stone-800">
                    {appointments.filter(a => a.status === "completed").length}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-stone-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-stone-400 text-sm mb-4">Have questions about an order or your upcoming appointment?</p>
                <button
                  className="w-full py-2.5 bg-white text-stone-900 rounded-xl font-bold hover:bg-stone-100 transition-colors shadow-sm"
                  onClick={() => navigate("/contact")}
                >
                  Contact Support
                </button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <Search className="w-32 h-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

