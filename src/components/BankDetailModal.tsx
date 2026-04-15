import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

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
  consultation_date?: string | null;
  apt_name?: string | null;
  unit_number?: string | null;
  contractor?: string | null;
  sale_price?: number | null;
  credit_loan?: string | null;
  collateral_loan?: string | null;
  desired_loan?: number | null;
  income?: number | null;
  desired_date?: string | null;
  notes?: string | null;
};

interface BankDetailModalProps {
  selected: ConsultationRequest;
  onClose: () => void;
  onRefresh: () => void;
  formatDate: (d: string) => string;
}

export default function BankDetailModal({ selected, onClose, onRefresh, formatDate }: BankDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [memo, setMemo] = useState(selected.memo ?? "");

  // Bank-specific fields
  const [consultationDate, setConsultationDate] = useState<Date | undefined>(
    selected.consultation_date ? new Date(selected.consultation_date) : new Date()
  );
  const [aptName, setAptName] = useState(selected.apt_name ?? selected.complex_name ?? "");
  const [unitNumber, setUnitNumber] = useState(selected.unit_number ?? "");
  const [contractor, setContractor] = useState(selected.contractor ?? "");
  const [salePrice, setSalePrice] = useState(selected.sale_price?.toString() ?? "");
  const [creditLoan, setCreditLoan] = useState(selected.credit_loan ?? "");
  const [collateralLoan, setCollateralLoan] = useState(selected.collateral_loan ?? "");
  const [desiredLoan, setDesiredLoan] = useState(selected.desired_loan?.toString() ?? "");
  const [income, setIncome] = useState(selected.income?.toString() ?? "");
  const [desiredDate, setDesiredDate] = useState<Date | undefined>(
    selected.desired_date ? new Date(selected.desired_date) : undefined
  );
  const [notes, setNotes] = useState(selected.notes ?? "");

  const handleSaveAll = async () => {
    setUpdating(true);
    const updateData: Record<string, unknown> = {
      memo,
      consultation_date: consultationDate ? format(consultationDate, "yyyy-MM-dd") : null,
      apt_name: aptName || null,
      unit_number: unitNumber || null,
      contractor: contractor || null,
      sale_price: salePrice ? Number(salePrice) : null,
      credit_loan: creditLoan || null,
      collateral_loan: collateralLoan || null,
      desired_loan: desiredLoan ? Number(desiredLoan) : null,
      income: income ? Number(income) : null,
      desired_date: desiredDate ? format(desiredDate, "yyyy-MM-dd") : null,
      notes: notes || null,
    };

    try {
      await api.updateConsultation(selected.id, updateData);
      toast.success("저장되었습니다.");
      onRefresh();
    } catch {
      toast.error("저장에 실패했습니다.");
    }
    setUpdating(false);
  };

  const handleStatusChange = async () => {
    setUpdating(true);
    const newStatus = selected.status === "대기중" ? "처리완료" : "대기중";
    try {
      await api.updateConsultation(selected.id, { status: newStatus });
      toast.success("상태가 변경되었습니다.");
      onClose();
      onRefresh();
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
    setUpdating(false);
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">신청자명</span><p className="font-medium">{selected.resident_name}</p></div>
        <div><span className="text-muted-foreground">업체명</span><p className="font-medium">{selected.vendor_name}</p></div>
        <div><span className="text-muted-foreground">단지명</span><p className="font-medium">{selected.complex_name}</p></div>
        <div><span className="text-muted-foreground">희망시간</span><p className="font-medium">{selected.preferred_time}</p></div>
        <div><span className="text-muted-foreground">신청일시</span><p className="font-medium">{formatDate(selected.created_at)}</p></div>
        <div><span className="text-muted-foreground">상태</span><p>
          <Badge className={selected.status === "처리완료" ? "border-transparent bg-green-100 text-green-800 hover:bg-green-100" : "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}>{selected.status}</Badge>
        </p></div>
      </div>

      {/* Bank-specific fields */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3">은행 상담 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* 상담일 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">상담일</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left text-sm h-9 font-normal", !consultationDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {consultationDate ? format(consultationDate, "yyyy-MM-dd") : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={consultationDate} onSelect={setConsultationDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* 아파트명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">아파트명</label>
            <Input className="h-9 text-sm" value={aptName} onChange={(e) => setAptName(e.target.value)} placeholder="아파트명" />
          </div>

          {/* 동호수 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">동호수</label>
            <Input className="h-9 text-sm" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="예: 101동 1201호" />
          </div>

          {/* 계약자 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">계약자</label>
            <Input className="h-9 text-sm" value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="계약자명" />
          </div>

          {/* 연락처 (기존 값 표시) */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">연락처</label>
            <Input className="h-9 text-sm bg-muted" value={selected.resident_phone} readOnly />
          </div>

          {/* 분양가 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">분양가 (원)</label>
            <Input className="h-9 text-sm" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0" />
          </div>

          {/* 신용대출 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">신용대출</label>
            <Input className="h-9 text-sm" value={creditLoan} onChange={(e) => setCreditLoan(e.target.value)} placeholder="신용대출 정보" />
          </div>

          {/* 담보대출 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">담보대출</label>
            <Input className="h-9 text-sm" value={collateralLoan} onChange={(e) => setCollateralLoan(e.target.value)} placeholder="담보대출 정보" />
          </div>

          {/* 대출희망금액 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">대출희망금액 (원)</label>
            <Input className="h-9 text-sm" type="number" value={desiredLoan} onChange={(e) => setDesiredLoan(e.target.value)} placeholder="0" />
          </div>

          {/* 소득금액 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">소득금액 (원)</label>
            <Input className="h-9 text-sm" type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0" />
          </div>

          {/* 대출희망일 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">대출희망일</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left text-sm h-9 font-normal", !desiredDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {desiredDate ? format(desiredDate, "yyyy-MM-dd") : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={desiredDate} onSelect={setDesiredDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 비고 (full width) */}
        <div className="space-y-1 mt-3">
          <label className="text-xs text-muted-foreground">비고</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="비고를 입력하세요..." rows={2} />
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="mb-1 block text-sm text-muted-foreground">메모</label>
        <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모를 입력하세요..." rows={2} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose}>닫기</Button>
        <Button variant="secondary" onClick={handleSaveAll} disabled={updating}>저장</Button>
        <Button onClick={handleStatusChange} disabled={updating}>
          {selected.status === "대기중" ? "처리완료로 변경" : "대기중으로 변경"}
        </Button>
      </div>
    </div>
  );
}
