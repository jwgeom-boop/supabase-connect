import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ConsultationRequest = {
  id: string;
  resident_name: string;
  resident_phone: string;
  vendor_name: string;
  vendor_type: string;
  complex_name: string;
  preferred_time: string;
  status: string;
  memo: string | null;
  created_at: string;
};

type StatusFilter = "all" | "대기중" | "처리완료";
type DateRange = "all" | "today" | "week" | "month";

const VENDOR_TYPES = ["전체", "인테리어", "이사", "인터넷·TV", "청소", "가구", "가전", "은행"];

export default function ConsultationDashboard() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [vendorTypeFilter, setVendorTypeFilter] = useState("전체");
  const [selected, setSelected] = useState<ConsultationRequest | null>(null);
  const [memo, setMemo] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("consultation_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("데이터를 불러오는데 실패했습니다.");
      console.error(error);
    } else {
      setRequests(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("consultation_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "consultation_requests" },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    let result = requests;

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (vendorTypeFilter !== "전체") {
      result = result.filter((r) => r.vendor_type === vendorTypeFilter);
    }

    if (dateRange !== "all") {
      const now = new Date();
      let start: Date;
      if (dateRange === "today") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === "week") {
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      result = result.filter((r) => new Date(r.created_at) >= start);
    }

    return result;
  }, [requests, statusFilter, dateRange, vendorTypeFilter]);

  const handleStatusChange = async () => {
    if (!selected) return;
    setUpdating(true);
    const newStatus = selected.status === "대기중" ? "처리완료" : "대기중";
    const { error } = await supabase
      .from("consultation_requests")
      .update({ status: newStatus, memo })
      .eq("id", selected.id);

    if (error) {
      toast.error("상태 변경에 실패했습니다.");
    } else {
      toast.success("상태가 변경되었습니다.");
      setSelected(null);
      fetchData();
    }
    setUpdating(false);
  };

  const handleSaveMemo = async () => {
    if (!selected) return;
    setUpdating(true);
    const { error } = await supabase
      .from("consultation_requests")
      .update({ memo })
      .eq("id", selected.id);

    if (error) {
      toast.error("메모 저장에 실패했습니다.");
    } else {
      toast.success("메모가 저장되었습니다.");
      fetchData();
    }
    setUpdating(false);
  };

  const openDetail = (req: ConsultationRequest) => {
    setSelected(req);
    setMemo(req.memo ?? "");
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const handleExcelDownload = () => {
    const rows = filtered.map((r, idx) => ({
      "번호": filtered.length - idx,
      "신청자명": r.resident_name,
      "연락처": r.resident_phone,
      "업체명": r.vendor_name,
      "업체유형": r.vendor_type,
      "단지명": r.complex_name,
      "희망시간": r.preferred_time,
      "상태": r.status,
      "메모": r.memo ?? "",
      "신청일시": formatDate(r.created_at),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "상담신청");

    const today = new Date();
    const fileName = `상담신청_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">상담신청 관리</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExcelDownload}>
            <Download className="mr-2 h-4 w-4" />
            엑셀 다운로드
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="대기중">대기중</TabsTrigger>
            <TabsTrigger value="처리완료">처리완료</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          {(["all", "today", "week", "month"] as DateRange[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {{ all: "전체기간", today: "오늘", week: "이번주", month: "이번달" }[range]}
            </Button>
          ))}
        </div>

        <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VENDOR_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto text-sm text-muted-foreground">총 {filtered.length}건</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">번호</TableHead>
              <TableHead>신청자명</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>업체명</TableHead>
              <TableHead>업체유형</TableHead>
              <TableHead>단지명</TableHead>
              <TableHead>희망시간</TableHead>
              <TableHead>신청일시</TableHead>
              <TableHead className="w-24">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">로딩 중...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">데이터가 없습니다.</TableCell>
              </TableRow>
            ) : (
              filtered.map((req, idx) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer transition-colors hover:bg-blue-50"
                  onClick={() => openDetail(req)}
                >
                  <TableCell className="font-medium">{filtered.length - idx}</TableCell>
                  <TableCell>{req.resident_name}</TableCell>
                  <TableCell>{req.resident_phone}</TableCell>
                  <TableCell>{req.vendor_name}</TableCell>
                  <TableCell>{req.vendor_type}</TableCell>
                  <TableCell>{req.complex_name}</TableCell>
                  <TableCell>{req.preferred_time}</TableCell>
                  <TableCell>{formatDate(req.created_at)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        req.status === "처리완료"
                          ? "border-transparent bg-green-100 text-green-800 hover:bg-green-100"
                          : "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {req.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>상담신청 상세</DialogTitle>
            <DialogDescription>신청 내역을 확인하고 상태를 변경할 수 있습니다.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">신청자명</span>
                  <p className="font-medium">{selected.resident_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">연락처</span>
                  <p className="font-medium">{selected.resident_phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">업체명</span>
                  <p className="font-medium">{selected.vendor_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">업체유형</span>
                  <p className="font-medium">{selected.vendor_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">단지명</span>
                  <p className="font-medium">{selected.complex_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">희망시간</span>
                  <p className="font-medium">{selected.preferred_time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">신청일시</span>
                  <p className="font-medium">{formatDate(selected.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">상태</span>
                  <p>
                    <Badge
                      className={
                        selected.status === "처리완료"
                          ? "border-transparent bg-green-100 text-green-800 hover:bg-green-100"
                          : "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                      }
                    >
                      {selected.status}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">메모</label>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={3}
                />
                <Button variant="outline" size="sm" className="mt-2" onClick={handleSaveMemo} disabled={updating}>
                  메모 저장
                </Button>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setSelected(null)}>닫기</Button>
                <Button onClick={handleStatusChange} disabled={updating}>
                  {selected.status === "대기중" ? "처리완료로 변경" : "대기중으로 변경"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
