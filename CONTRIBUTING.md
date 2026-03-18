# Contributing to AzureLens

First off — thank you for considering contributing to AzureLens! 🎉

Every contribution matters, whether it's fixing a typo, adding a feature, or improving documentation.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)

---

## Code of Conduct

This project follows a simple rule: **be kind and respectful**. We welcome contributors from all backgrounds and experience levels.

---

## How Can I Contribute?

### 🐛 Reporting Bugs

1. Check if the issue already exists in [GitHub Issues](https://github.com/YOUR_USERNAME/azurelens/issues)
2. If not, open a new issue with:
   - A clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node.js version, Azure subscription type)

### 💡 Suggesting Features

Open an issue with the `enhancement` label. Describe:
- The problem you're trying to solve
- Your proposed solution
- Why this would benefit other users

### 🔧 Submitting Code

Good first contributions:
- Adding support for more Azure resource types (SQL, CosmosDB, Redis)
- Improving cost estimation accuracy
- Adding more AKS waste detection rules
- Writing tests
- Improving documentation

---

## Development Setup

### Prerequisites

- Node.js 18+
- An Azure subscription (free trial works)
- Git

### Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/azurelens.git
cd azurelens

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/azurelens.git
```

### Install & Run

```bash
# Backend
cd azurelens-backend
cp .env.example .env
# Fill in your Azure credentials in .env
npm install
node index.js

# Frontend (new terminal)
cd ..
npm install
npm run dev
```

---

## Project Structure

```
azurelens/
├── azurelens-backend/          # Node.js + Express backend
│   ├── index.js                # Entry point + auto-scan scheduler
│   ├── db.js                   # SQLite database setup (sql.js)
│   ├── routes/
│   │   └── api.js              # All REST API endpoints
│   └── services/
│       ├── azure.js            # VMs, Disks, Public IPs scanning
│       └── aks.js              # AKS clusters scanning
│
└── src/                        # React + TypeScript frontend
    ├── pages/                  # Page components (one per route)
    │   ├── Index.tsx           # Main dashboard
    │   ├── VirtualMachines.tsx
    │   ├── DisksStorage.tsx
    │   ├── Networking.tsx
    │   ├── AKS.tsx
    │   ├── Reports.tsx
    │   ├── Settings.tsx
    │   └── Login.tsx
    ├── components/
    │   └── dashboard/          # Reusable dashboard widgets
    │       ├── StatCard.tsx
    │       ├── WasteTable.tsx
    │       ├── CostTrendChart.tsx
    │       ├── WasteCategoryBreakdown.tsx
    │       ├── OptimizationScore.tsx
    │       ├── RecentActivity.tsx
    │       ├── AKSSummaryCard.tsx
    │       └── DashboardSidebar.tsx
    └── hooks/
        └── useAzureData.ts     # Data fetching hook
```

---

## Adding a New Azure Resource Type

To add support for a new resource (e.g., Azure SQL, App Services):

### 1. Add the scan function in `services/azure.js`

```javascript
async function getAppServices() {
  const credential = getCredential();
  const client = new WebSiteManagementClient(credential, SUBSCRIPTION_ID);
  const apps = [];

  for await (const app of client.webApps.list()) {
    apps.push({
      id:       app.id,
      name:     app.name,
      type:     'App Service',
      location: app.location,
      status:   app.state,
      sku:      app.sku?.name,
    });
  }
  return apps;
}
```

### 2. Add waste detection logic

```javascript
function analyzeAppServiceWaste(apps) {
  return apps
    .filter(app => app.status === 'Stopped')
    .map(app => ({
      ...app,
      waste_type:   'idle',
      severity:     'medium',
      monthly_cost: estimateAppServiceCost(app.sku),
    }));
}
```

### 3. Add API endpoint in `routes/api.js`

```javascript
router.get('/app-services', async (req, res) => {
  try {
    const apps  = await getAppServices();
    const waste = analyzeAppServiceWaste(apps);
    res.json({ apps, waste });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 4. Create the frontend page in `src/pages/`

Follow the pattern of `VirtualMachines.tsx` — fetch from `/api/app-services`, display in a table.

### 5. Add to sidebar in `DashboardSidebar.tsx`

```typescript
{ label: "App Services", icon: Globe, path: "/app-services" },
```

---

## Submitting Changes

1. **Create a branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes** and test them
3. **Commit with a clear message**:
   ```
   feat: add Azure App Service scanning
   fix: correct disk cost estimation for Premium SSD
   docs: update README with Docker instructions
   ```
4. **Push**: `git push origin feature/your-feature-name`
5. **Open a Pull Request** on GitHub with:
   - What the PR does
   - Screenshots if it changes the UI
   - How to test it

---

## Style Guidelines

### TypeScript / JavaScript

- Use `async/await` over `.then()` chains
- Prefer `const` over `let`
- Use meaningful variable names
- Add comments for complex logic

### React Components

- One component per file
- Props interface defined above the component
- Loading and error states always handled

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes nor adds
- `chore:` — build process or tooling changes

---

## Questions?

Open a [GitHub Discussion](https://github.com/YOUR_USERNAME/azurelens/discussions) or reach out on LinkedIn.

**Thank you for contributing to AzureLens!** 🚀
