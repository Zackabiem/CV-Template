import express from "express";
import path from "path";
import fs from "fs";
import initSqlJs from "sql.js";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "10mb" }));

  // Initialize SQL.js database
  let db;
  const dbFile = path.join(process.cwd(), "resumes.db");

  try {
    const wasmPath = path.join(__dirname, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WebAssembly file not found at: ${wasmPath}`);
    }
    const wasmBinary = fs.readFileSync(wasmPath);
    const SQL = await initSqlJs({ wasmBinary });

    if (fs.existsSync(dbFile)) {
      try {
        const fileBuffer = fs.readFileSync(dbFile);
        db = new SQL.Database(fileBuffer);
        console.log("Connected to SQLite database via SQL.js at:", dbFile);
      } catch (err) {
        console.error("Failed to load existing SQLite database from disk:", err.message);
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
      console.log("Created new in-memory SQLite database via SQL.js");
    }
  } catch (err) {
    console.error("Critical error during SQL.js initialization:", err.message);
    process.exit(1);
  }

  // Save helper to persist database state back to disk
  const saveToDisk = () => {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbFile, buffer);
    } catch (err) {
      console.error("Failed to save SQL.js database to disk:", err.message);
    }
  };

  // Create tables if they do not exist by reading schema.sql
  const schemaPath = path.join(__dirname, "schema.sql");
  let createTableSql = `
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      personalInfo TEXT,
      summary TEXT,
      workExperiences TEXT,
      education TEXT,
      skills TEXT,
      projects TEXT,
      certifications TEXT,
      languages TEXT,
      referees TEXT,
      hobbies TEXT,
      styleSettings TEXT,
      updatedAt INTEGER
    )
  `;
  try {
    if (fs.existsSync(schemaPath)) {
      createTableSql = fs.readFileSync(schemaPath, "utf8");
      console.log("Loaded schema SQL from schema.sql");
    }
  } catch (schemaErr) {
    console.warn("Failed to read schema.sql, falling back to default schema query:", schemaErr.message);
  }

  try {
    db.run(createTableSql);
    saveToDisk();
    console.log("Resumes table verified / created successfully.");
  } catch (err) {
    console.error("Failed to create resumes table:", err.message);
  }

  // API Endpoints
  
  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", database: "sql.js" });
  });

  // 2. Get list of all saved resumes
  app.get("/api/resumes", (req, res) => {
    try {
      const stmt = db.prepare("SELECT id, title, personalInfo, updatedAt FROM resumes ORDER BY updatedAt DESC");
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      const list = rows.map((row) => {
        let fullName = "Untitled Resume";
        let titleRole = "";
        try {
          if (row.personalInfo) {
            const pi = JSON.parse(row.personalInfo);
            fullName = pi.fullName || fullName;
            titleRole = pi.title || "";
          }
        } catch (e) {
          // Ignore parse errors
        }

        return {
          id: row.id,
          title: row.title,
          fullName,
          titleRole,
          updatedAt: row.updatedAt
        };
      });

      res.json(list);
    } catch (err) {
      console.error("Failed to query resumes:", err.message);
      res.status(500).json({ error: "Failed to load resumes from database." });
    }
  });

  // 3. Get single resume by ID
  app.get("/api/resumes/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("SELECT * FROM resumes WHERE id = ?");
      stmt.bind([id]);
      const row = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();

      if (!row) {
        return res.status(404).json({ error: "Resume not found." });
      }

      const cvData = {
        personalInfo: JSON.parse(row.personalInfo || "{}"),
        summary: row.summary || "",
        workExperiences: JSON.parse(row.workExperiences || "[]"),
        education: JSON.parse(row.education || "[]"),
        skills: JSON.parse(row.skills || "[]"),
        projects: JSON.parse(row.projects || "[]"),
        certifications: JSON.parse(row.certifications || "[]"),
        languages: JSON.parse(row.languages || "[]"),
        referees: JSON.parse(row.referees || "[]"),
        hobbies: JSON.parse(row.hobbies || "[]")
      };

      const styleSettings = JSON.parse(row.styleSettings || "{}");

      res.json({
        id: row.id,
        title: row.title,
        cvData,
        styleSettings,
        updatedAt: row.updatedAt
      });
    } catch (err) {
      console.error(`Failed to query resume ${id}:`, err.message);
      res.status(500).json({ error: "Failed to retrieve resume from database." });
    }
  });

  // 4. Create or update a resume
  app.post("/api/resumes", (req, res) => {
    const { id, title, cvData, styleSettings } = req.body;

    if (!id || !title || !cvData || !styleSettings) {
      return res.status(400).json({ error: "Missing required fields (id, title, cvData, styleSettings)." });
    }

    const personalInfoStr = JSON.stringify(cvData.personalInfo || {});
    const workExperiencesStr = JSON.stringify(cvData.workExperiences || []);
    const educationStr = JSON.stringify(cvData.education || []);
    const skillsStr = JSON.stringify(cvData.skills || []);
    const projectsStr = JSON.stringify(cvData.projects || []);
    const certificationsStr = JSON.stringify(cvData.certifications || []);
    const languagesStr = JSON.stringify(cvData.languages || []);
    const refereesStr = JSON.stringify(cvData.referees || []);
    const hobbiesStr = JSON.stringify(cvData.hobbies || []);
    const styleSettingsStr = JSON.stringify(styleSettings || {});
    const now = Date.now();

    try {
      db.run(
        `INSERT OR REPLACE INTO resumes (
          id, title, personalInfo, summary, workExperiences, education, skills, projects, certifications, languages, referees, hobbies, styleSettings, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          title,
          personalInfoStr,
          cvData.summary || "",
          workExperiencesStr,
          educationStr,
          skillsStr,
          projectsStr,
          certificationsStr,
          languagesStr,
          refereesStr,
          hobbiesStr,
          styleSettingsStr,
          now
        ]
      );
      
      saveToDisk();

      res.json({
        success: true,
        id,
        title,
        updatedAt: now
      });
    } catch (err) {
      console.error("Failed to save/update resume:", err.message);
      res.status(500).json({ error: "Failed to write resume to database." });
    }
  });

  // 5. Delete a resume by ID
  app.delete("/api/resumes/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.run("DELETE FROM resumes WHERE id = ?", [id]);
      saveToDisk();
      res.json({ success: true });
    } catch (err) {
      console.error(`Failed to delete resume ${id}:`, err.message);
      res.status(500).json({ error: "Failed to delete resume from database." });
    }
  });

  // Create assets/passport directory on process.cwd() (local disk) if it doesn't exist
  const passportDir = path.join(process.cwd(), "assets", "passport");
  if (!fs.existsSync(passportDir)) {
    fs.mkdirSync(passportDir, { recursive: true });
  }

  // Serve assets folder statically so they can be loaded by the browser (from the local disk)
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  // 6. Upload passport image to assets/passport
  app.post("/api/upload-passport", (req, res) => {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    try {
      // image is a base64 data URI: data:image/png;base64,iVBORw0KGgoAAAANS...
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 image data" });
      }

      const ext = matches[1].split("/")[1] || "png";
      const buffer = Buffer.from(matches[2], "base64");
      
      const safeFilename = `passport_${Date.now()}.${ext}`;
      const filePath = path.join(passportDir, safeFilename);
      
      fs.writeFileSync(filePath, buffer);
      const fileUrl = `/assets/passport/${safeFilename}`;
      
      res.json({ success: true, url: fileUrl });
    } catch (err) {
      console.error("Failed to save passport upload:", err.message);
      res.status(500).json({ error: "Failed to save passport to disk" });
    }
  });

  // Vite development middleware vs Static Production bundle
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log(`👉 To view the app locally on Windows/macOS, open: http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup error:", err);
});
