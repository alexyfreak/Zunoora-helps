export interface MissingField {
  key: string;
  label: string;
  question: string;
}

export const SHABLON_KEYWORDS: Record<string, string[]> = {
  ariza: ["ariza", "murojaat", "iltimos", "soʻrov", "formal", "yozib ber", "ariza yoz"],
  ish_tabeli: ["ish tabeli", "tabel", "dars jadvali", "jadval", "soat", "ish vaqti"],
  ktp: ["ktp", "kalendar", "tematik plan", "dars plani", "yillik plan"],
  oum: ["oum", "oʻquv uslubiy", "majmua", "dars ishlanmasi", "metodik"],
  bsb_chb: ["bsb", "chb", "summativ", "baholash", "choraklik", "nazorat ishi"],
  sillabus: ["sillabus", "syllabus", "oʻquv dasturi", "dastur", "kurs dasturi"],
  hisobot: ["hisobot", "yillik hisobot", "choraklik hisobot", "statistika", "koʻrsatkich"],
  tushuntirish_xati: ["tushuntirish", "xat", "izoh", "tushuntirish xati"],
};

export const FIELD_META: Record<string, { label: string; question: string }> = {
  recipient_title: {
    label: "Qabul qiluvchi lavozimi",
    question: "Kimga murojaat qilmoqchisiz? (Direktor, Mudir, Boshliq...)",
  },
  recipient_name: {
    label: "Qabul qiluvchi F.I.Sh.",
    question: "Qabul qiluvchining toʻliq ismi nima?",
  },
  sender_name: { label: "Yuboruvchi F.I.Sh.", question: "Sizning ismingiz nima?" },
  sender_position: { label: "Yuboruvchi lavozimi", question: "Sizning lavozimingiz nima?" },
  reason: { label: "Sabab", question: "Arizaning sababi nima? (batafsil yozing)" },
  date: { label: "Sana", question: "Qaysi sanani koʻrsataylik? (masalan: 14-iyul 2026)" },
  school: { label: "Maktab nomi", question: "Maktab nomi nima?" },
  subject: { label: "Fan nomi", question: "Qaysi fan?" },
  class_name: { label: "Sinf", question: "Qaysi sinf?" },
  academic_year: { label: "Oʻquv yili", question: "Qaysi oʻquv yili?" },
  period: { label: "Davr", question: "Qaysi davr uchun? (chorak, yarim yillik, yillik)" },
  teacher_name: { label: "Oʻqituvchi F.I.Sh.", question: "Oʻqituvchining ismi nima?" },
  week_start: { label: "Hafta boshi", question: "Haftaning boshlanish sanasi?" },
  week_end: { label: "Hafta oxiri", question: "Haftaning tugash sanasi?" },
  goals: { label: "Maqsad", question: "Fanning maqsadi nima?" },
  students: {
    label: "Oʻquvchilar roʻyxati",
    question: "Oʻquvchilarning ismlarini vergul bilan ajratib yozing:",
  },
  total_hours: { label: "Jami soat", question: "Jami necha soat?" },
  hours_week: { label: "Haftalik soat", question: "Haftada necha soat?" },
  quarter: { label: "Chorak", question: "Qaysi chorak?" },
  explanation: { label: "Tushuntirish", question: "Tushuntirish matnini yozing:" },
  letter_topic: { label: "Mavzu", question: "Xatning mavzusi nima?" },
};

export function fillTemplate(template: string, fields: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(fields)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  result = result.replace(/\{\{.+?\}\}/g, "______________");
  return result;
}

export function getFieldLabels(fields: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const f of fields) {
    if (FIELD_META[f]) {
      result[f] = FIELD_META[f].label;
    } else {
      result[f] = f;
    }
  }
  return result;
}
