import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { ClipboardList, Building2, Megaphone, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useState } from "react";

const sidebarItems = [
  { title: "대시보드", url: "/dashboard", icon: LayoutDashboard },
  { title: "상담신청 관리", url: "/consultation", icon: ClipboardList },
  { title: "업체 계정 관리", url: "/vendors", icon: Building2 },
  { title: "공지사항 관리", url: "/notices", icon: Megaphone },
];

const AdminLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-60" : "w-0 overflow-hidden"} transition-all duration-300 flex flex-col text-white shrink-0`}
        style={{ backgroundColor: "#1E3A5F" }}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/10 font-bold text-lg tracking-wide">
          입주ON 관리자
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors"
              activeClassName="bg-white/15 text-white font-medium"
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-lg">입주ON 관리자</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </header>
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
