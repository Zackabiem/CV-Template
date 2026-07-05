# Resume Forge — Professional ATS-Optimized Resume Builder

Resume Forge is a powerful, full-stack, and high-fidelity interactive resume builder designed to help job seekers create beautifully formatted, ATS-compliant, and professional resumes in minutes. It supports multiple templates, live side-by-side editing and preview, persistent database storage, and premium vector-grade browser-native PDF exports.

---

## 🚀 Key Features

- **Interactive Live Editor**: Form-based controls for structured information entry (Personal Info, Summary, Work History, Education, Projects, Skills, Certifications, Languages, Referees, and Hobbies) with customizable section headings.
- **Multiple Tailored Templates**: Swap layouts instantly with dynamic engine presets:
  - **Creative/Pill-tag**
  - **Minimalist Chronological**
  - **Academic & Research (R&D)**
  - **Left Rail Sidebar**
  - **Executive Standard**
  - **Timeline Strip**
- **Strict 1-Page A4 Constraint Toggle**: A smart toggle to instantly lock your document to a single page. It applies a high-density compact overrides system that dynamically optimizes margins, paddings, gap spacings, and typography so content fits elegantly without spilling over.
- **Over 10+ Aesthetic Font Styles**: Select from an expanded library of premium typefaces using a responsive dropdown selector with a real-time typography preview card:
  - **Sans-Serif**: Inter Sans, Outfit Round, System Default
  - **Serif**: Times New Roman, Cormorant Garamond, Lora, Merriweather, Playfair Display, Georgia
  - **Monospace/Grotesque**: Space Grotesk, JetBrains Mono, Fira Code
- **Pristine PDF Typography**: Engineered custom anti-smudging CSS for native prints. By resolving synthetic browser double-bolding and smoothing vector font curves, text remains perfectly crisp and legible upon PDF generation.
- **ATS-Optimized Searchable PDFs**: Utilizes high-fidelity browser-native typography and styling matching strict pixel requirements. Resumes exported via the print module maintain searchable/selectable text for applicant tracking system parsing.
- **SQLite Database Persistence**: Full-stack design with a lightweight Express server automatically saving drafts to a local SQLite database (`resumes.db`) so your work is never lost.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Motion/React (f.k.a. Framer Motion) for elegant micro-interactions, Lucide Icons.
- **Backend**: Express (NodeJS) custom server.
- **Build Utilities**: `tsx` for direct TypeScript execution in dev, `esbuild` for bundling and compiling backend TypeScript into a fast standalone CJS module, `vite` for client bundle compiling.
- **Database**: SQLite3 (`sqlite3`) for robust local document storage.

---

## 💻 How to Test Locally

Follow these straightforward steps to download and test Resume Forge on your local machine:

### 1. Prerequisites
Ensure you have the following installed on your system:
- **Node.js**: Version 18.x or above (Node 20+ is recommended)
- **npm**: Version 9.x or above

### 2. Download and Extract the Source Code
Export the project files from AI Studio (using the settings menu) or clone the repository to your local drive, then navigate to the project directory:
```bash
cd resume-builder
```

### 3. Install Dependencies (CRITICAL FIRST STEP)
Before running any scripts, you **MUST** install the local packages. This populates your `node_modules` directory and creates local executables like `tsx`:
```bash
npm install
```

### 4. Initialize the Database Schema (Isolated SQL)
Resume Forge separates database definitions from server code. Run the following command to initialize or verify your schema structure before starting:
```bash
npm run init-db
```
*This reads raw table structure directly from `/schema.sql` and sets up the storage engine!*

### 5. Configure Environment Variables
Create a local `.env` configuration file. You can copy the structure directly from the provided example file:
```bash
cp .env.example .env
```
Open the `.env` file in your favorite text editor and populate the keys:
```env
# Required for any optional AI assist features (if used)
GEMINI_API_KEY="your-gemini-api-key-here"

# The local host address
APP_URL="http://localhost:3000"
```

### 6. Run the App in Development Mode
Launch the unified Express development server:
```bash
npm run dev
```
Once started, open your web browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

*Note: In development mode, the server uses `tsx` to seamlessly run the backend API server on port 3000, while the embedded Vite middleware serves dynamic, hot-reloading asset files.*

---

## 🛠️ Database Isolation & Schemas (The Professional Approach)

To follow clean engineering patterns, the database structure is decoupled from server application logic:
- **/schema.sql**: Houses the raw, plain SQL definitions (`CREATE TABLE IF NOT EXISTS...`). This can be shared across multiple environments or migrated easily.
- **/init-db.ts**: An execution script that reads `/schema.sql` and deploys it onto the SQLite backend. It can be triggered via `npm run init-db`.
- **/server.ts**: Automatically loads `/schema.sql` to verify tables on boot, preventing hardcoded string queries and preserving strict TypeScript-JS separation.

---

## 📦 Production Build & Testing

To test how the application performs in a fully optimized production environment:

1. **Compile & Bundle**: Build both the static frontend assets and compile the TypeScript Express backend:
   ```bash
   npm run build
   ```
   This command compiles client assets into `/dist` and bundles the Express server into a standalone `/dist/server.cjs` file using `esbuild`.

2. **Start Production Server**: Launch the compiled server:
   ```bash
   npm run start
   ```
   Now visit `http://localhost:3000` to interact with the fast production container-ready build.

3. **Database Maintenance**: To reset or wipe the local database during testing:
   ```bash
   npm run clean
   ```

---

## 🖨️ Pro-Tips: Exporting ATS-Optimized PDFs
When downloading your resume as a PDF, Resume Forge initiates a smart native-print helper modal. Following these instructions ensures your file is perfectly scaled for printing and readable by applicant tracking systems (ATS):

1. **Destination**: Select **Save as PDF** or **Microsoft Print to PDF**.
2. **Background Graphics**: In print settings (under *More Settings*), **check** the box next to **Background graphics** so that accent ribbons, background panels, and styling render properly.
3. **Headers & Footers**: **Uncheck** the box next to **Headers and footers** to clean up the page margins from browser URLs and date stamps.
4. **Paper Size & Margins**: Set Paper size to **A4** (or Letter) with **Default** margins and **100%** scale.
