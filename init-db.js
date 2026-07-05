import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log("--------------------------------------------------");
  console.log("🛠️  RESUME FORGE DATABASE INITIALIZER (SQL.JS)");
  console.log("--------------------------------------------------");
  
  const schemaPath = path.join(__dirname, "schema.sql");
  const dbPath = path.join(process.cwd(), "resumes.db");

  if (!fs.existsSync(schemaPath)) {
    console.error("❌ Error: schema.sql not found at", schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, "utf8");
  console.log("📖 Loaded schema.sql successfully.");

  try {
    const wasmPath = path.join(__dirname, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WebAssembly file not found at: ${wasmPath}`);
    }
    const wasmBinary = fs.readFileSync(wasmPath);
    const SQL = await initSqlJs({ wasmBinary });
    const db = new SQL.Database();
    console.log("🔌 Initialized SQL.js in-memory database.");

    db.run(sql);
    console.log("✅ Database schema successfully applied!");

    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log("💾 Saved database to disk at:", dbPath);
    
    db.close();
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
    process.exit(1);
  }
}

initDatabase().catch((err) => {
  console.error("❌ Unexpected database initialization error:", err);
});
