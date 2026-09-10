import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const managerPasswordHash = await bcrypt.hash("manager123", 10);
  const staffPasswordHash = await bcrypt.hash("staff123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@erp.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@erp.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@erp.local" },
    update: {},
    create: {
      name: "Manager",
      email: "manager@erp.local",
      passwordHash: managerPasswordHash,
      role: "MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@erp.local" },
    update: {},
    create: {
      name: "Staff",
      email: "staff@erp.local",
      passwordHash: staffPasswordHash,
      role: "STAFF",
    },
  });

  const category = await prisma.category.upsert({
    where: { name: "General" },
    update: {},
    create: { name: "General" },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { name: "Main Warehouse" },
    update: {},
    create: { name: "Main Warehouse", location: "Jakarta" },
  });

  const product = await prisma.product.upsert({
    where: { sku: "SKU-0001" },
    update: {},
    create: {
      sku: "SKU-0001",
      name: "Sample Product",
      unit: "pcs",
      costPrice: 10000,
      sellingPrice: 15000,
      minStock: 10,
      categoryId: category.id,
    },
  });

  await prisma.stock.upsert({
    where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
    update: {},
    create: { productId: product.id, warehouseId: warehouse.id, quantity: 50 },
  });

  await prisma.supplier.upsert({
    where: { id: "seed-supplier" },
    update: {},
    create: { id: "seed-supplier", name: "PT Supplier Utama", email: "supplier@example.com" },
  });

  await prisma.customer.upsert({
    where: { id: "seed-customer" },
    update: {},
    create: { id: "seed-customer", name: "PT Pelanggan Setia", email: "customer@example.com" },
  });

  const department = await prisma.department.upsert({
    where: { name: "Operations" },
    update: {},
    create: { name: "Operations" },
  });

  await prisma.employee.upsert({
    where: { employeeCode: "EMP-0001" },
    update: {},
    create: {
      employeeCode: "EMP-0001",
      fullName: "Budi Santoso",
      position: "Operations Staff",
      departmentId: department.id,
      baseSalary: 6000000,
    },
  });

  await prisma.account.upsert({
    where: { code: "1000" },
    update: {},
    create: { code: "1000", name: "Cash", type: "ASSET" },
  });

  console.log("Seed complete. Admin user:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
