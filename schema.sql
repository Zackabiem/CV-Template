-- Schema definition for Resume Forge SQLite Database

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
);
