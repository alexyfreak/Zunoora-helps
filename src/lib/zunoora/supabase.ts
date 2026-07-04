import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase.from("teachers").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function fetchTeacherById(id: string): Promise<Teacher | null> {
  const { data, error } = await supabase.from("teachers").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function fetchTeacherByEmail(email: string): Promise<Teacher | null> {
  const { data, error } = await supabase.from("teachers").select("*").eq("email", email).single();
  if (error) {
    console.error("fetchTeacherByEmail error:", error);
    return null;
  }
  return data;
}

export async function fetchShablons(): Promise<Shablon[]> {
  const { data, error } = await supabase.from("shablons").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function fetchShablonByType(type: string): Promise<Shablon | null> {
  const { data, error } = await supabase.from("shablons").select("*").eq("type", type).single();
  if (error) {
    console.error("fetchShablonByType error:", error);
    return null;
  }
  return data;
}

export async function fetchSchools(): Promise<School[]> {
  const { data, error } = await supabase.from("schools").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function findDirectorBySchool(schoolName: string): Promise<Director | null> {
  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("name", schoolName)
    .single();

  if (!school) return null;

  const { data, error } = await supabase
    .from("directors")
    .select("*")
    .eq("school_id", school.id)
    .single();
  if (error) {
    console.error("findDirectorBySchool error:", error);
    return null;
  }
  return data;
}

export async function findDirectorBySchoolId(schoolId: string): Promise<Director | null> {
  const { data, error } = await supabase
    .from("directors")
    .select("*")
    .eq("school_id", schoolId)
    .single();
  if (error) {
    console.error("findDirectorBySchoolId error:", error);
    return null;
  }
  return data;
}

export async function findPupilsByClass(className: string, schoolId: string): Promise<Pupil[]> {
  const { data: classData } = await supabase
    .from("classes")
    .select("id")
    .eq("name", className)
    .eq("school_id", schoolId)
    .single();

  if (!classData) return [];

  const { data, error } = await supabase.from("pupils").select("*").eq("class_id", classData.id);
  if (error) {
    console.error("findPupilsByClass error:", error);
    return [];
  }
  return data ?? [];
}

export async function findClassesBySchool(schoolId: string): Promise<Class[]> {
  const { data, error } = await supabase.from("classes").select("*").eq("school_id", schoolId);
  if (error) {
    console.error("findClassesBySchool error:", error);
    return [];
  }
  return data ?? [];
}

export async function findPreviousDocument(
  teacherId: string,
  shablonType: string,
  filters?: Record<string, string>,
): Promise<Document | null> {
  const { data: shablon } = await supabase
    .from("shablons")
    .select("id")
    .eq("type", shablonType)
    .single();

  if (!shablon) return null;

  let query = supabase
    .from("documents")
    .select("*")
    .eq("shablon_id", shablon.id)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(`fields_used->>${key}`, value);
    }
  }

  const { data, error } = await query.single();
  if (error) {
    return null;
  }
  return data;
}

export async function saveDocument(doc: {
  teacher_id: string;
  shablon_id: string;
  title?: string;
  content: string;
  fields_used: Record<string, string>;
}): Promise<Document | null> {
  const { data, error } = await supabase.from("documents").insert(doc).select().single();
  if (error) {
    console.error("saveDocument error:", error);
    return null;
  }
  return data;
}

export async function ensureDatabaseSeeded(): Promise<boolean> {
  const { data: teachers, error: tErr } = await supabase.from("teachers").select("id").limit(1);
  if (tErr) {
    console.error("ensureDatabaseSeeded teachers check error:", tErr);
    return false;
  }

  if (teachers && teachers.length > 0) {
    return true;
  }

  const { data: shablons, error: sErr } = await supabase.from("shablons").select("id").limit(1);
  if (sErr) {
    console.error("ensureDatabaseSeeded shablons check error:", sErr);
    return false;
  }

  if (shablons && shablons.length > 0) {
    return true;
  }

  return false;
}

export async function seedDatabase(): Promise<void> {
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      -- Run the seed SQL via Supabase's pg_dump or REST API
      -- This is a placeholder; actual seeding is done manually via SQL Editor
    `,
  });
  if (error) console.error("Seed error (expected if RPC not available):", error);
}
