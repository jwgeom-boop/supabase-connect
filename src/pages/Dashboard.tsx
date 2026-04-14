import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell,
} from "@/components/ui/table";
import { ClipboardList, Building2, Clock, CheckCircle } from "lucide-react";

type RecentRequest = {
  id: string;
  resident_name: string;
  vendor_name: string;
  vendor_type: string;
  preferred_time: string;
  status: string;
  created_at: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  const fetchData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayRes, pendingRes, completedRes, vendorRes, recentRes] = await Promise.all([
      supabase
        .from("consultation_requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
      supabase
        .from("consultation_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "대기중"),
      supabase
        .from("consultation_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "처리완료"),
      supabase
        .from("vendor_accounts")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("consultation_requests")
        .select("id, resident_name, vendor_name, vendor_type, preferred_time, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    setTodayCount(todayRes.count ?? 0);
    setPendingCount(pendingRes.count ?? 0);
    setCompletedCount(completedRes.count ?? 0);
    setVendorCount(vendorRes.count ?? 0);
    setRecentRequests(recentRes.data ?? []);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultation_requests" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = [
    { label: "오늘 상담신청", value: todayCount, icon: ClipboardList, bg: "hsl(213, 50%, 24%)" },
    { label: "대기중 상담", value: pendingCount, icon: Clock, bg: "hsl(40, 80%, 50%)" },
    { label: "처리완료 상담", value: completedCount, icon: CheckCircle, bg: "hsl(150, 50%, 35%)" },
    { label: "전체 업체 수", value: vendorCount, icon: Building2, bg: "hsl(260, 50%, 45%)" },
  ];

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                <s.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <p className="text-2xl md:text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 최근 상담신청 */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-3 md:p-6">
          <CardTitle className="text-base md:text-lg">최근 상담신청</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/consultation")} className="text-xs md:text-sm">
            전체보기
          </Button>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {recentRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">상담신청 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">신청자명</TableHead>
                    <TableHead className="text-xs md:text-sm">업체명</TableHead>
                    <TableHead className="text-xs md:text-sm hidden sm:table-cell">업체유형</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">희망시간</TableHead>
                    <TableHead className="text-xs md:text-sm">상태</TableHead>
                    <TableHead className="text-xs md:text-sm hidden sm:table-cell">신청일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-xs md:text-sm">{r.resident_name}</TableCell>
                      <TableCell className="text-xs md:text-sm">{r.vendor_name}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden sm:table-cell">{r.vendor_type}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden md:table-cell">{r.preferred_time}</TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === "처리완료" ? "default" : "secondary"}
                          className={`text-xs ${
                            r.status === "처리완료"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs hidden sm:table-cell">{formatDate(r.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
