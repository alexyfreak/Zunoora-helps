import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User, Loader2 } from "lucide-react";
import { useZunoora } from "@/lib/zunoora/store";
import {
  fetchTeacherByEmail,
  findDirectorBySchool,
  type Director,
} from "@/lib/zunoora/database";
import { isAIConfigured } from "@/lib/zunoora/ai";

export function AccountDialog() {
  const account = useZunoora((s) => s.account);
  const setAccount = useZunoora((s) => s.setAccount);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [director, setDirector] = useState<Director | null>(null);

  const handleEmailChange = async (email: string) => {
    setAccount({ email });
    if (!email || !email.includes("@")) return;

    setLoading(true);
    setStatus("Ma'lumotlar tekshirilmoqda...");
    try {
      const teacher = await fetchTeacherByEmail(email);
      if (teacher) {
        setAccount({ name: teacher.full_name, email: teacher.email || email });
        setStatus("O'qituvchi topildi: " + teacher.full_name);
        if (teacher.school) {
          const dir = await findDirectorBySchool(teacher.school);
          setDirector(dir);
        }
      } else {
        setStatus("Bu email bilan o'qituvchi topilmadi. Ma'lumotlarni qo'lda kiriting.");
      }
    } catch {
      setStatus("Ma'lumotlar bazasiga ulanishda xatolik. Blanks/ papkasini tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-[var(--surface)] hover:text-foreground">
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{account.name}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--surface)] border-[var(--hairline)]">
        <DialogHeader>
          <DialogTitle className="serif-italic text-lg font-normal">Account</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2 text-sm">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              Email (ma'lumotlarni yuklash uchun)
            </span>
            <div className="relative">
              <Input
                value={account.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="teacher@school.uz"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </label>
          {status && <p className="text-xs text-muted-foreground/80">{status}</p>}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Name</span>
            <Input value={account.name} onChange={(e) => setAccount({ name: e.target.value })} />
          </label>
          {director && (
            <div className="rounded-md border border-[var(--hairline)] bg-[var(--surface-hover)]/50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Maktab direktori
              </div>
              <div className="mt-0.5 text-sm text-foreground">{director.full_name}</div>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/60">
            <div
              className={`h-1.5 w-1.5 rounded-full ${isAIConfigured() ? "bg-green-500" : "bg-yellow-500"}`}
            />
            <span>
              AI: {isAIConfigured() ? "Ulangan" : "Sozlanmagan (Settings > AI Provider)"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
