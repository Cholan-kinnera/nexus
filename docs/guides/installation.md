# Local Installation Guide — Nexus PM

This guide provides step-by-step instructions to clone the repository, install system dependencies, configure local databases, and launch the frontend and backend services.

---

## Prerequisites

Before starting, ensure your local development machine has the following tools installed:
* **Git** (for version control)
* **Python 3.12+**
* **Node.js 20+** and **npm**
* **PostgreSQL 15+** and **Redis** (optional if using live cloud keys)

---

## 1. Clone the Repository

Clone the project repository and navigate into the root directory:
```bash
git clone https://github.com/Cholan-kinnera/nexus.git
cd nexus
```

---

## 2. Backend Setup & Installation

The backend is built with FastAPI. We recommend isolating dependencies using a Python virtual environment.

### A. Initialize Virtual Environment
On Windows (PowerShell):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
On macOS / Linux:
```bash
python -m venv venv
source venv/bin/activate
```

### B. Install Python Packages
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### C. Configure Environment Variables
Copy the template configuration file to create your local variables sheet:
```bash
cp .env.example .env
```
Open the `.env` file and configure your local PostgreSQL connection string under `DATABASE_URL` (e.g., `postgresql+asyncpg://postgres:password@localhost:5432/nexus_pm`).

---

## 3. Database Initialisation

Run database migrations to generate the required PostgreSQL tables and foreign key indexes:
```bash
alembic upgrade head
```

---

## 4. Frontend Setup & Installation

The React frontend utilizes Vite. Navigate to the `frontend/` directory to configure packages.

### A. Install Dependencies
```bash
cd frontend
npm ci
```

### B. Configure Environment Variables
Copy the template variables file:
```bash
cp .env.example .env
```
Ensure the API endpoint is directed to your local server:
```http
VITE_API_URL=http://localhost:8000
```
Return to the project root:
```bash
cd ..
```

---

## 5. Launching the Services

To verify the installation, launch both the backend and frontend servers in separate terminal tabs.

### Launch Backend
Ensure the virtual environment is activated, then run the startup entry point:
```bash
python main.py
```
The API server will launch at `http://127.0.0.1:8000`. You can review the API documentation (Swagger) by visiting `http://127.0.0.1:8000/api/docs`.

### Launch Frontend
Open a new terminal tab, navigate to the `frontend` folder, and launch Vite:
```bash
cd frontend
npm run dev
```
The frontend SPA will compile and launch, typically at `http://localhost:5173`.

---

## 6. Verifying & First Login

1. Open your browser and navigate to `http://localhost:5173/auth`.
2. Select the **Sign Up** tab.
3. Register using your email address and credentials.
4. **OTP Verification:** 
   * **If `RESEND_API_KEY` is not set:** Look at your backend console output terminal. The 6-digit OTP code will print directly to the logs. Copy this code and paste it into the UI verification modal.
   * **If `RESEND_API_KEY` is set:** Check your email inbox for the verification token.
5. Once verified, you will be redirected to the platform dashboard.
