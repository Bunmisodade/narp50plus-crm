import { supabase } from "./supabaseClient";

export async function getMyCooperativeId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("cooperative_id")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data.cooperative_id;
}

export async function listMembers() {
  const { data, error } = await supabase
    .from("members")
    .select("*, member_notes(*)")
    .order("member_no", { ascending: true });
  if (error) throw error;
  return data;
}

export async function nextMemberNo(cooperativeId) {
  const { data, error } = await supabase
    .from("members")
    .select("member_no")
    .eq("cooperative_id", cooperativeId)
    .order("member_no", { ascending: false })
    .limit(1);
  if (error) throw error;
  const last = data?.[0]?.member_no;
  const lastNum = last ? parseInt(last.split("-")[1], 10) : 0;
  return "NARP-" + String(lastNum + 1).padStart(4, "0");
}

export async function addMember(cooperativeId, member) {
  const member_no = await nextMemberNo(cooperativeId);
  const { data, error } = await supabase
    .from("members")
    .insert([{ ...member, cooperative_id: cooperativeId, member_no }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addNote(memberId, cooperativeId, text) {
  const { data, error } = await supabase
    .from("member_notes")
    .insert([{ member_id: memberId, cooperative_id: cooperativeId, text }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
