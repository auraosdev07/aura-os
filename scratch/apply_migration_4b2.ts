import { getServerContext } from "@/lib/auth/get-server-context";
import fs from "fs";

async function applyMigration() {
  const { supabase } = await getServerContext();
  const sql = fs.readFileSync("c:/projects/aura-os/supabase/migrations/20260806000032_seo_intelligence_layer.sql", "utf-8");
  
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    console.log("Executing:", statement.slice(0, 50) + "...");
    try {
      await supabase.rpc("exec_sql", { sql: statement });
    } catch {
      // Ignored
    }
  }
}
applyMigration();
