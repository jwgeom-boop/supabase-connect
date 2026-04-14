import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Building2, Clock } from "lucide-react";

const Dashboard = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayRes, vendorRes, pendingRes] = await Promise.all([
        supabase
          .from("consultation_requests")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
        supabase
          .from("vendor_accounts")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("consultation_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      setTodayCount(todayRes.count ?? 0);
      setVendorCount(vendorRes.count ?? 0);
      setPendingCount(pendingRes.count ?? 0);
    };

    fetchStats();
  }, []);

  const stats = [
    { label: "오늘 상담신청", value: todayCount, icon: ClipboardList, color: "hsl(213, 50%, 24%)" },
    { label: "전체 업체 수", value: vendorCount, icon: Building2, color: "hsl(150, 50%, 35%)" },
    { label: "대기중 상담", value: pendingCount, icon: Clock, color: "hsl(40, 80%, 50%)" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color }}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
