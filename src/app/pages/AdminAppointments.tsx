
import { AppointmentsManagement } from "../components/AppointmentsManagement";
import { CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router";

export function AdminAppointments() {
  const navigate = useNavigate();

  const goBack = () => navigate("/dashboard/admin");

  return (
    <div>
      <AppointmentsManagement />
    </div>
  );
}

