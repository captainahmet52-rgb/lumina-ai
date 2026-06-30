import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Root — bounce to the studio when logged in, otherwise to the login screen. */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
