-- Zunoora: Seed data — Teachers + Shablons (O'zbek tilida)
-- Run after migration.sql in Supabase SQL Editor

begin;

-- ============================================================
-- TEACHERS (10 ta o'qituvchi)
-- ============================================================
delete from teachers;
insert into teachers (full_name, age, subject, classes, phone, email, school, position, extra_info) values
(
  'Abdullayev Azizjon Alisher oʻgʻli',
  34,
  'Matematika',
  '{"9-A","9-B","10-A","10-B"}',
  '+998901234567',
  'azizjon@school.uz',
  '21-umumiy oʻrta maktab',
  'Oʻqituvchi',
  '{"experience_years": 10, "degree": "bakalavr"}'
),
(
  'Karimova Nilufar Baxtiyor qizi',
  29,
  'Ona tili va adabiyot',
  '{"8-A","8-B","9-A","9-B"}',
  '+998902345678',
  'nilufar@school.uz',
  '5-IDUM',
  'Oʻqituvchi',
  '{"experience_years": 6, "degree": "magistr"}'
),
(
  'Raximov Jahongir Sobir oʻgʻli',
  41,
  'Fizika',
  '{"10-A","10-B","11-A","11-B"}',
  '+998903456789',
  'jahongir@school.uz',
  '35-maktab',
  'Katta oʻqituvchi',
  '{"experience_years": 18, "degree": "magistr"}'
),
(
  'Toshmatova Malohat Erkin qizi',
  26,
  'Ingliz tili',
  '{"5-A","5-B","6-A","6-B"}',
  '+998904567890',
  'malohat@school.uz',
  '12-umumiy oʻrta maktab',
  'Oʻqituvchi',
  '{"experience_years": 3, "degree": "bakalavr"}'
),
(
  'Rustamov Ulugʻbek Akmal oʻgʻli',
  38,
  'Tarix',
  '{"9-A","9-B","10-A","10-B","11-A"}',
  '+998905678901',
  'ulugbek@school.uz',
  '1-ixtisoslashtirilgan maktab',
  'Oʻqituvchi',
  '{"experience_years": 14, "degree": "magistr"}'
),
(
  'Nazarova Zebiniso Qahramon qizi',
  31,
  'Kimyo',
  '{"8-A","8-B","9-A"}',
  '+998906789012',
  'zebiniso@school.uz',
  '21-umumiy oʻrta maktab',
  'Oʻqituvchi',
  '{"experience_years": 8, "degree": "magistr"}'
),
(
  'Sultonov Bahrom Karim oʻgʻli',
  45,
  'Direktor',
  '{}',
  '+998907890123',
  'bahrom@school.uz',
  '21-umumiy oʻrta maktab',
  'Direktor',
  '{"experience_years": 22, "degree": "magistr"}'
),
(
  'Xodjayeva Nilufar Anvar qizi',
  28,
  'Biologiya',
  '{"8-A","8-B","9-A","9-B"}',
  '+998908901234',
  'nilufar.x@school.uz',
  '35-maktab',
  'Oʻqituvchi',
  '{"experience_years": 5, "degree": "bakalavr"}'
),
(
  'Mirzayev Davron Erkin oʻgʻli',
  36,
  'Jismoniy tarbiya',
  '{"5-A","5-B","6-A","6-B","7-A","7-B","8-A","8-B"}',
  '+998909012345',
  'davron@school.uz',
  '5-IDUM',
  'Oʻqituvchi',
  '{"experience_years": 13, "degree": "bakalavr"}'
),
(
  'Komilova Shahlo Baxtiyor qizi',
  33,
  'Ona tili va adabiyot',
  '{"10-A","10-B","11-A"}',
  '+998901098765',
  'shahlo@school.uz',
  '21-umumiy oʻrta maktab',
  'O''qituvchi',
  '{"experience_years": 9, "degree": "magistr"}'
);

-- ============================================================
-- SHABLONS (8 ta dokument shabloni)
-- ============================================================
delete from shablons;
-- 1. ARIZA
insert into shablons (type, label, description, keywords, schema, template) values
(
  'ariza',
  'Ariza (formal murojaat)',
  'Rasmiy ariza yozish uchun shablon. Direktor, mudir yoki boshqa rahbarlarga murojaat qilish uchun.',
  '{"ariza", "murojaat", "iltimos", "soʻrov", "formal"}',
  '{
    "required": ["recipient_title", "recipient_name", "sender_name", "sender_position", "reason", "date"],
    "optional": ["school", "reference_number", "phone"]
  }',
  '{{school}} direktori {{recipient_title}} {{recipient_name}}ga

Arizachi: {{sender_name}}
{{sender_position}}

ARIZA

{{reason}}

Sana: {{date}}

Imzo: ________
({{sender_name}})'
);

-- 2. ISH TABELI
insert into shablons (type, label, description, keywords, schema, template) values
(
  'ish_tabeli',
  'Ish Tabeli (work schedule)',
  'Oʻqituvchining haftalik dars jadvalini tuzish uchun shablon.',
  '{"ish tabeli", "tabel", "dars jadvali", "jadval", "soat"}',
  '{
    "required": ["teacher_name", "subject", "classes", "week_start", "week_end"],
    "optional": ["school", "total_hours", "notes"]
  }',
  '{{school}}

ISHLAB CHIQILGAN SOATLAR TABELI

Oʻqituvchi: {{teacher_name}}
Fan: {{subject}}
Sinf: {{classes}}
Hafta: {{week_start}} – {{week_end}}

| Kun | Sinf | Soat | Mavzu |
|----|------|------|-------|
| Dushanba | | | |
| Seshanba | | | |
| Chorshanba | | | |
| Payshanba | | | |
| Juma | | | |
| Shanba | | | |

Jami soat: {{total_hours}}

Direktor: ______________

{{school}}
{{date}}'
);

-- 3. KTP (Kalendar-tematik plan)
insert into shablons (type, label, description, keywords, schema, template) values
(
  'ktp',
  'Kalendar-tematik plan (KTP)',
  'Yillik kalendar-tematik plan tuzish uchun shablon. Har chorak uchun dars mavzulari.',
  '{"ktp", "kalendar", "tematik plan", "dars plani", "yillik plan"}',
  '{
    "required": ["teacher_name", "subject", "class_name", "academic_year"],
    "optional": ["school", "hours_total", "hours_week", "quarters"]
  }',
  '{{school}}

KALENDAR-TEMATIK PLAN

Oʻqituvchi: {{teacher_name}}
Fan: {{subject}}
Sinf: {{class_name}}
Oʻquv yili: {{academic_year}}
Haftalik soat: {{hours_week}}
Yillik soat: {{hours_total}}

I-CHORAK (sentyabr – noyabr)
| № | Mavzu | Sana | Soat |
|---|-------|------|------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

II-CHORAK (noyabr – dekabr)
| № | Mavzu | Sana | Soat |
|---|-------|------|------|

III-CHORAK (yanvar – mart)
| № | Mavzu | Sana | Soat |
|---|-------|------|------|

IV-CHORAK (mart – iyun)
| № | Mavzu | Sana | Soat |
|---|-------|------|------|

{{school}}
{{date}}
Tuzuvchi: {{teacher_name}}'
);

-- 4. O'UM (Oʻquv-uslubiy majmua)
insert into shablons (type, label, description, keywords, schema, template) values
(
  'oum',
  'Oʻquv-uslubiy majmua (OʻUM)',
  'Oʻquv-uslubiy majmua tayyorlash uchun shablon. Dars ishlanmalari va materiallar.',
  '{"oum", "oʻquv uslubiy", "majmua", "dars ishlanmasi"}',
  '{
    "required": ["teacher_name", "subject", "class_name", "academic_year"],
    "optional": ["school", "modules", "methodology", "materials"]
  }',
  '{{school}}

OʻQUV-USLUBIY MAJMUA (OʻUM)

Fan: {{subject}}
Sinf: {{class_name}}
Oʻqituvchi: {{teacher_name}}
Oʻquv yili: {{academic_year}}

1. Nazariy materiallar
_________________________

2. Amaliy mashgʻulotlar
_________________________

3. Mustaqil ta''lim uchun topshiriqlar
_________________________

4. Baholash mezonlari
_________________________

5. Foydalanilgan adabiyotlar
_________________________

{{school}}
{{date}}'
);

-- 5. BSB/CHB (Baholash)
insert into shablons (type, label, description, keywords, schema, template) values
(
  'bsb_chb',
  'BSB/CHB (summativ baholash)',
  'BSB (bosqichli summativ baholash) va CHB (choraklik baholash) natijalarini rasmiylashtirish.',
  '{"bsb", "chb", "summativ", "baholash", "choraklik", "nazorat"}',
  '{
    "required": ["teacher_name", "subject", "class_name", "quarter", "students"],
    "optional": ["school", "academic_year", "average", "quality_percent", "mastery_percent"]
  }',
  '{{school}}

BSB / CHB NATIJALARI

Oʻqituvchi: {{teacher_name}}
Fan: {{subject}}
Sinf: {{class_name}}
Chorak: {{quarter}}
Oʻquv yili: {{academic_year}}

| № | Oʻquvchi | 1-BSB | 2-BSB | CHB | Umumiy |
|---|----------|-------|-------|-----|--------|
| 1 | | | | | |

Sifat foizi: {{quality_percent}}%
Oʻzlashtirish foizi: {{mastery_percent}}%
Oʻrtacha ball: {{average}}

{{school}}
{{date}}
Oʻqituvchi: {{teacher_name}}'
);

-- 6. SILLABUS
insert into shablons (type, label, description, keywords, schema, template) values
(
  'sillabus',
  'Sillabus (oʻquv dasturi)',
  'Fanning toʻliq sillabusi — maqsad, mavzular, adabiyotlar va baholash mezonlari.',
  '{"sillabus", "syllabus", "oʻquv dasturi", "dastur", "kurs"}',
  '{
    "required": ["teacher_name", "subject", "class_name", "academic_year", "goals"],
    "optional": ["school", "hours", "literature", "requirements", "grading"]
  }',
  '{{school}}

SILLABUS
{{subject}} fanidan ({{class_name}}-sinf)
Oʻquv yili: {{academic_year}}

Oʻqituvchi: {{teacher_name}}

1. FANNING MAQSADI VA VAZIFALARI
{{goals}}

2. FANNING MAZMUNI
| № | Mavzu | Soat | Sana |
|---|-------|------|------|
| 1 | | | |

3. TAVSIYA ETILGAN ADABIYOTLAR
{{literature}}

4. BAHOLASH MEZONLARI
{{grading}}

{{school}}
{{date}}
Oʻqituvchi: {{teacher_name}}'
);

-- 7. HISOBOT
insert into shablons (type, label, description, keywords, schema, template) values
(
  'hisobot',
  'Hisobot (choraklik/yillik)',
  'Choraklik va yillik hisobotlarni tayyorlash uchun shablon. Oʻzlashtirish, sifat koʻrsatkichlari.',
  '{"hisobot", "yillik hisobot", "choraklik hisobot", "statistika", "koʻrsatkich"}',
  '{
    "required": ["teacher_name", "subject", "period", "academic_year"],
    "optional": ["school", "student_count", "mastery", "quality", "conclusions", "recommendations"]
  }',
  '{{school}}

HISOBOT

Oʻqituvchi: {{teacher_name}}
Fan: {{subject}}
Davr: {{period}}
Oʻquv yili: {{academic_year}}

1. OʻQUVCHILAR SONI
Jami oʻquvchilar: {{student_count}}

2. OʻZLASHTIRISH KOʻRSATKICHLARI
Oʻzlashtirish foizi: {{mastery}}%
Sifat foizi: {{quality}}%

3. XULOSA VA TAKLIFLAR
{{conclusions}}

{{school}}
{{date}}
Oʻqituvchi: {{teacher_name}}'
);

-- 8. TUSHUNTIRISH XATI
insert into shablons (type, label, description, keywords, schema, template) values
(
  'tushuntirish_xati',
  'Tushuntirish xati',
  'Biror voqea yoki holat yuzasidan tushuntirish xati yozish uchun shablon.',
  '{"tushuntirish", "xat", "izoh", "tushuntirish xati"}',
  '{
    "required": ["recipient_title", "recipient_name", "sender_name", "sender_position", "letter_topic", "explanation", "date"],
    "optional": ["school", "reference_number", "phone"]
  }',
  '{{school}} direktori {{recipient_title}} {{recipient_name}}ga

Arizachi: {{sender_name}}
{{sender_position}}

TUSHUNTIRISH XATI

Mavzu: {{letter_topic}}

{{explanation}}

Sana: {{date}}

Imzo: ________
({{sender_name}})'
);

commit;
