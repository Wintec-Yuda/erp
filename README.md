# ERP System

Aplikasi ERP modern berbasis Next.js (App Router) dengan TypeScript, Prisma + SQLite, NextAuth (Auth.js) untuk autentikasi & RBAC, Tailwind CSS untuk UI, serta axios + React Query untuk data-fetching di client.

## Modul

- **Inventory**: Products, Categories, Warehouses, Stock & Stock Movements
- **Purchasing**: Suppliers, Purchase Orders (dengan alur DRAFT → ORDERED → RECEIVED yang otomatis menambah stok)
- **Sales**: Customers, Sales Orders (dengan alur DRAFT → CONFIRMED yang otomatis mengurangi stok → SHIPPED → COMPLETED)
- **Finance**: Chart of Accounts, Invoices (Payable/Receivable) & Payments
- **HR**: Departments, Employees, Payroll

## Role & Akses (RBAC)

- **ADMIN**: akses penuh ke semua modul termasuk pengaturan.
- **MANAGER**: akses penuh ke operasional, termasuk HR (payroll) dan Finance (chart of accounts).
- **STAFF**: akses operasional dasar (input transaksi harian), tanpa akses ke payroll dan chart of accounts.

## Menjalankan Secara Lokal

```bash
npm install
npm run db:migrate   # generate & apply Prisma migration (development)
npm run db:seed      # membuat user demo + data awal
npm run dev
```

Akun demo setelah seeding:

| Role    | Email             | Password   |
|---------|-------------------|------------|
| Admin   | admin@erp.local   | admin123   |
| Manager | manager@erp.local | manager123 |
| Staff   | staff@erp.local   | staff123   |

## Struktur Proyek

```
prisma/
  schema.prisma       # skema data seluruh modul
  seed.ts             # data awal (admin user, contoh produk, dll)
src/
  app/
    (erp)/            # halaman-halaman yang butuh sidebar & sesi login
    api/              # REST API routes (App Router route handlers)
    login/            # halaman login
  components/
    ui/               # komponen UI dasar (Button, Card, Modal, dll)
    crud/             # komponen generik untuk CRUD sederhana
    layout/           # sidebar & layout
  lib/
    prisma.ts         # Prisma client singleton
    auth.ts           # konfigurasi NextAuth + RBAC
    api-auth.ts        # helper requireSession() untuk API routes
    api-response.ts    # helper response & error handler API
    validations.ts      # skema validasi zod
    api-client.ts       # axios instance untuk client

```

## Catatan Skalabilitas

- Setiap modul memiliki API route, skema validasi, dan halaman UI yang terpisah sehingga mudah dipecah menjadi microservice atau ditambah modul baru.
- Transaksi stok (penerimaan PO, konfirmasi SO) dibungkus dalam `prisma.$transaction` agar konsisten.
- RBAC diterapkan di dua level: middleware (halaman) dan `requireSession()` (API), sehingga proteksi tetap berlaku meski API diakses langsung.
