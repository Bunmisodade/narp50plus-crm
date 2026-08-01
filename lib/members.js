import { supabase } from "./supabaseClient";

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("cooperative_id, role, member_id, full_name")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}

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
    .select("*, member_notes(*), member_products(*, product_transactions(*))")
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

// Creates the product itself. Balance always starts at 0 — if the member
// already has money in this product (e.g. an existing savings balance being
// migrated in), pass openingAmount and it's recorded as the first transaction,
// not set directly.
export async function addMemberProduct(cooperativeId, memberId, product) {
  const { data: newProduct, error } = await supabase
    .from("member_products")
    .insert([{
      cooperative_id: cooperativeId,
      member_id: memberId,
      product_type: product.productType,
      status: product.status || "active",
      principal: product.principal ? Number(product.principal) : null,
      interest_rate: product.interestRate ? Number(product.interestRate) : null,
      opened_date: product.openedDate || new Date().toISOString().slice(0, 10),
      maturity_date: product.maturityDate || null,
      notes: product.notes || null,
    }])
    .select()
    .single();
  if (error) throw error;

  if (product.openingAmount && Number(product.openingAmount) > 0) {
    await addProductTransaction(cooperativeId, newProduct.id, {
      transactionType: product.productType === "loan" ? "disbursement" : "deposit",
      direction: "credit",
      amount: product.openingAmount,
      description: "Opening balance",
    });
  }

  return { ...newProduct, product_transactions: [] };
}

// Records a transaction against an existing product. This is the only
// supported way to change a product's balance — the database trigger
// recomputes member_products.balance from the sum of these rows.
export async function addProductTransaction(cooperativeId, memberProductId, tx) {
  const { data, error } = await supabase
    .from("product_transactions")
    .insert([{
      cooperative_id: cooperativeId,
      member_product_id: memberProductId,
      transaction_type: tx.transactionType,
      direction: tx.direction,
      amount: Number(tx.amount),
      transaction_date: tx.transactionDate || new Date().toISOString().slice(0, 10),
      description: tx.description || null,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Re-fetches a single product (with its updated balance and full transaction
// history) after a new transaction is recorded, since the balance is updated
// by a trigger rather than by the insert response itself.
export async function getMemberProduct(memberProductId) {
  const { data, error } = await supabase
    .from("member_products")
    .select("*, product_transactions(*)")
    .eq("id", memberProductId)
    .single();
  if (error) throw error;
  return data;
}

export async function inviteMemberToPortal(memberId) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/members/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify({ memberId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create invite code");
  return data; // { code, emailSent }
}
