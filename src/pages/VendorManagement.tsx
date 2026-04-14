import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  vendor_name: string;
  vendor_type: string;
  login_id: string;
  password: string;
  phone: string;
  status: string;
  created_at: string;
}

const VENDOR_TYPES = ["인테리어", "이사", "인터넷·TV", "청소", "가구", "가전", "은행"];

const emptyForm = {
  vendor_name: "",
  vendor_type: "",
  login_id: "",
  password: "",
  phone: "",
};

const VendorManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vendor_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "데이터 로딩 실패", description: error.message, variant: "destructive" });
    } else {
      setVendors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openAddModal = () => {
    setEditVendor(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (v: Vendor) => {
    setEditVendor(v);
    setForm({
      vendor_name: v.vendor_name,
      vendor_type: v.vendor_type,
      login_id: v.login_id,
      password: v.password,
      phone: v.phone,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.vendor_name || !form.vendor_type || !form.login_id || !form.password || !form.phone) {
      toast({ title: "모든 필드를 입력해주세요.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editVendor) {
      const { error } = await supabase
        .from("vendor_accounts")
        .update({
          vendor_name: form.vendor_name,
          vendor_type: form.vendor_type,
          login_id: form.login_id,
          password: form.password,
          phone: form.phone,
        })
        .eq("id", editVendor.id);
      if (error) {
        toast({ title: "수정 실패", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "업체 정보가 수정되었습니다." });
        setModalOpen(false);
        fetchVendors();
      }
    } else {
      const { error } = await supabase
        .from("vendor_accounts")
        .insert({
          vendor_name: form.vendor_name,
          vendor_type: form.vendor_type,
          login_id: form.login_id,
          password: form.password,
          phone: form.phone,
          status: "active",
        });
      if (error) {
        toast({ title: "추가 실패", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "업체가 추가되었습니다." });
        setModalOpen(false);
        fetchVendors();
      }
    }
    setSaving(false);
  };

  const toggleStatus = async (v: Vendor) => {
    const newStatus = v.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("vendor_accounts")
      .update({ status: newStatus })
      .eq("id", v.id);
    if (error) {
      toast({ title: "상태 변경 실패", description: error.message, variant: "destructive" });
    } else {
      fetchVendors();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("vendor_accounts")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "업체가 삭제되었습니다." });
      fetchVendors();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">업체 계정 관리</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchVendors}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-1" /> 업체 추가
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">번호</TableHead>
              <TableHead>업체명</TableHead>
              <TableHead>업체유형</TableHead>
              <TableHead>아이디</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  등록된 업체가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((v, i) => (
                <TableRow key={v.id} className="hover:bg-blue-50/60">
                  <TableCell>{vendors.length - i}</TableCell>
                  <TableCell className="font-medium">{v.vendor_name}</TableCell>
                  <TableCell>{v.vendor_type}</TableCell>
                  <TableCell>{v.login_id}</TableCell>
                  <TableCell>{v.phone}</TableCell>
                  <TableCell>{new Date(v.created_at).toLocaleDateString("ko-KR")}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        v.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                      }
                    >
                      {v.status === "active" ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(v)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={v.status === "active"}
                        onCheckedChange={() => toggleStatus(v)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(v)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editVendor ? "업체 정보 수정" : "업체 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>업체명</Label>
              <Input
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                placeholder="업체명 입력"
              />
            </div>
            <div className="space-y-1.5">
              <Label>업체유형</Label>
              <Select value={form.vendor_type} onValueChange={(v) => setForm({ ...form, vendor_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>로그인 아이디</Label>
              <Input
                value={form.login_id}
                onChange={(e) => setForm({ ...form, login_id: e.target.value })}
                placeholder="아이디 입력"
              />
            </div>
            <div className="space-y-1.5">
              <Label>임시 비밀번호</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="비밀번호 입력"
              />
            </div>
            <div className="space-y-1.5">
              <Label>연락처</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-0000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업체 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.vendor_name}" 업체를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorManagement;
