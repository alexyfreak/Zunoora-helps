export type Teacher = {
  id: string;
  full_name: string;
  age: number | null;
  subject: string | null;
  classes: string[];
  phone: string | null;
  email: string | null;
  school: string | null;
  school_id: string | null;
  position: string | null;
  extra_info: Record<string, unknown>;
  created_at: string;
};

export type Shablon = {
  id: string;
  type: string;
  label: string;
  description: string | null;
  keywords: string[];
  schema: {
    required: string[];
    optional: string[];
  };
  template: string;
  created_at: string;
};

export type School = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  director_id: string | null;
  created_at: string;
};

export type Director = {
  id: string;
  full_name: string;
  school_id: string | null;
  phone: string | null;
  email: string | null;
  position: string;
  created_at: string;
};

export type Class = {
  id: string;
  name: string;
  school_id: string;
  form_teacher_id: string | null;
  academic_year: string | null;
};

export type Pupil = {
  id: string;
  full_name: string;
  class_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  created_at: string;
};

export type Document = {
  id: string;
  teacher_id: string;
  shablon_id: string | null;
  title: string | null;
  content: string | null;
  fields_used: Record<string, string> | null;
  created_at: string;
};

const DB_PREFIX = "zunoora_db_v1";
const CACHE_KEYS = {
  teachers: `${DB_PREFIX}_teachers`,
  shablons: `${DB_PREFIX}_shablons`,
  schools: `${DB_PREFIX}_schools`,
  directors: `${DB_PREFIX}_directors`,
  classes: `${DB_PREFIX}_classes`,
  pupils: `${DB_PREFIX}_pupils`,
  documents: `${DB_PREFIX}_documents`,
};

async function loadJSON<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.warn(`Failed to cache ${key}`);
  }
}

async function getTeachers(): Promise<Teacher[]> {
  const cached = getCache<Teacher[]>(CACHE_KEYS.teachers);
  if (cached) return cached;
  const data = await loadJSON<Teacher[]>("/Blanks/teachers.json");
  setCache(CACHE_KEYS.teachers, data);
  return data;
}

async function getShablons(): Promise<Shablon[]> {
  const cached = getCache<Shablon[]>(CACHE_KEYS.shablons);
  if (cached) return cached;
  const data = await loadJSON<Shablon[]>("/Blanks/shablons.json");
  setCache(CACHE_KEYS.shablons, data);
  return data;
}

async function getSchools(): Promise<School[]> {
  const cached = getCache<School[]>(CACHE_KEYS.schools);
  if (cached) return cached;
  const data = await loadJSON<School[]>("/Blanks/schools.json");
  setCache(CACHE_KEYS.schools, data);
  return data;
}

async function getDirectors(): Promise<Director[]> {
  const cached = getCache<Director[]>(CACHE_KEYS.directors);
  if (cached) return cached;
  const data = await loadJSON<Director[]>("/Blanks/directors.json");
  setCache(CACHE_KEYS.directors, data);
  return data;
}

async function getClasses(): Promise<Class[]> {
  const cached = getCache<Class[]>(CACHE_KEYS.classes);
  if (cached) return cached;
  const data = await loadJSON<Class[]>("/Blanks/classes.json");
  setCache(CACHE_KEYS.classes, data);
  return data;
}

export async function fetchTeachers(): Promise<Teacher[]> {
  return getTeachers();
}

export async function fetchTeacherById(id: string): Promise<Teacher | null> {
  const teachers = await getTeachers();
  return teachers.find((t) => t.id === id) ?? null;
}

export async function fetchTeacherByEmail(email: string): Promise<Teacher | null> {
  const teachers = await getTeachers();
  return teachers.find((t) => t.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function fetchShablons(): Promise<Shablon[]> {
  return getShablons();
}

export async function fetchShablonByType(type: string): Promise<Shablon | null> {
  const shablons = await getShablons();
  return shablons.find((s) => s.type === type) ?? null;
}

export async function fetchSchools(): Promise<School[]> {
  return getSchools();
}

export async function findDirectorBySchool(schoolName: string): Promise<Director | null> {
  const schools = await getSchools();
  const school = schools.find((s) => s.name === schoolName);
  if (!school || !school.director_id) return null;
  const directors = await getDirectors();
  return directors.find((d) => d.id === school.director_id) ?? null;
}

export async function findDirectorBySchoolId(schoolId: string): Promise<Director | null> {
  const directors = await getDirectors();
  return directors.find((d) => d.school_id === schoolId) ?? null;
}

export async function findPupilsByClass(className: string, schoolId: string): Promise<Pupil[]> {
  return [];
}

export async function findClassesBySchool(schoolId: string): Promise<Class[]> {
  const classes = await getClasses();
  return classes.filter((c) => c.school_id === schoolId);
}

export async function findPreviousDocument(
  teacherId: string,
  shablonType: string,
  _filters?: Record<string, string>,
): Promise<Document | null> {
  const stored = getCache<Document[]>(CACHE_KEYS.documents);
  if (!stored) return null;
  return (
    stored.find((d) => d.teacher_id === teacherId && d.title?.includes(shablonType)) ?? null
  );
}

export async function saveDocument(doc: {
  teacher_id: string;
  shablon_id: string;
  title?: string;
  content: string;
  fields_used: Record<string, string>;
}): Promise<Document | null> {
  const newDoc: Document = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    teacher_id: doc.teacher_id,
    shablon_id: doc.shablon_id,
    title: doc.title ?? null,
    content: doc.content,
    fields_used: doc.fields_used,
    created_at: new Date().toISOString(),
  };
  const stored = getCache<Document[]>(CACHE_KEYS.documents) ?? [];
  stored.push(newDoc);
  setCache(CACHE_KEYS.documents, stored);
  return newDoc;
}

export async function ensureDatabaseSeeded(): Promise<boolean> {
  try {
    const teachers = await getTeachers();
    return teachers.length > 0;
  } catch {
    return false;
  }
}

export async function seedDatabase(): Promise<void> {
  const teachers = await getTeachers();
  if (teachers.length > 0) {
    console.log("Database already seeded");
    return;
  }
  console.log("Please ensure Blanks/ directory contains all required JSON files");
}
