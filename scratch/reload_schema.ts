import { getServerContext } from "@/lib/auth/get-server-context";

async function reloadSchemaCache() {
  const { supabase } = await getServerContext();
  const { data, error } = await supabase.rpc("exec_sql", {
    sql: "NOTIFY pgrst, 'reload schema';"
  });
  console.log("Reload Schema Result:", data, "Error:", error);
}

reloadSchemaCache();
