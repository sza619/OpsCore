import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "./db.js";

const firstNames = [
  "John",
  "Jane",
  "Michael",
  "Emily",
  "David",
  "Sarah",
  "Robert",
  "Lisa",
  "James",
  "Mary",
  "William",
  "Jennifer",
  "Richard",
  "Patricia",
  "Thomas",
  "Linda",
  "Charles",
  "Barbara",
  "Daniel",
  "Elizabeth",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
];

const actions = [
  "user:login",
  "user:logout",
  "user:create",
  "user:update",
  "user:delete",
  "role:create",
  "role:update",
  "role:delete",
  "permission:denied",
  "settings:update",
];
const resources = [
  "auth",
  "users",
  "roles",
  "permissions",
  "settings",
  "analytics",
  "audit",
];
const statuses = ["success", "failure"];

async function seed() {
  console.log("Starting database seed...");

  // Create permissions
  const permissionList = [
    { name: "users:create", category: "users" },
    { name: "users:read", category: "users" },
    { name: "users:update", category: "users" },
    { name: "users:delete", category: "users" },
    { name: "roles:read", category: "roles" },
    { name: "roles:update", category: "roles" },
    { name: "audit:read", category: "audit" },
    { name: "analytics:read", category: "analytics" },
  ];

  for (const permission of permissionList) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: { name: permission.name, category: permission.category },
    });
  }

  await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin" },
  });

  await prisma.role.upsert({
    where: { name: "Manager" },
    update: {},
    create: { name: "Manager" },
  });

  await prisma.role.upsert({
    where: { name: "Viewer" },
    update: {},
    create: { name: "Viewer" },
  });
  const roles = await prisma.role.findMany();
  const adminRole = roles.find((r) => r.name === "Admin");
  const managerRole = roles.find((r) => r.name === "Manager");
  const viewerRole = roles.find((r) => r.name === "Viewer");

  if (!adminRole || !managerRole || !viewerRole) {
    console.error("Default roles not found. Please run migrations first.");
    return;
  }

  const permissions = await prisma.permission.findMany();

  // Admin → all permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@opscore.io" },
    update: {},
    create: {
      email: "admin@opscore.io",
      password: hashedPassword,
      name: "Admin User",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log("Creating 50 dummy users...");
  const users = [];

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@opscore.io`;
    const name = `${firstName} ${lastName}`;

    const password = await bcrypt.hash("password123", 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password,
        name,
        lastLoginAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    const role = Math.random() < 0.2 ? managerRole : viewerRole;

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });

    users.push(user);
  }

  console.log("Creating 10,000 audit logs...");
  const allUsers = [adminUser, ...users];
  const batchSize = 1000;

  for (let batch = 0; batch < 10; batch++) {
    const logs = [];

    for (let i = 0; i < batchSize; i++) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const status = Math.random() < 0.9 ? "success" : "failure";

      logs.push({
        userId: Math.random() < 0.95 ? user.id : null,
        action,
        resource,
        details: `${action} performed on ${resource}`,
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status,
        createdAt: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
        ),
      });
    }

    await prisma.auditLog.createMany({
      data: logs,
      skipDuplicates: true,
    });

    console.log(
      `Created batch ${batch + 1}/10 (${(batch + 1) * batchSize} logs)`,
    );
  }

  console.log("Creating mock request logs...");
  const endpoints = [
    "/api/users",
    "/api/roles",
    "/api/audit",
    "/api/analytics/dashboard",
    "/api/auth/login",
    "/api/auth/me",
  ];
  const methods = ["GET", "POST", "PUT", "DELETE"];

  const requestLogs = [];
  for (let i = 0; i < 1000; i++) {
    requestLogs.push({
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      statusCode: Math.random() < 0.95 ? 200 : 500,
      duration: Math.floor(Math.random() * 500) + 10,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  await prisma.requestLog.createMany({
    data: requestLogs,
  });

  console.log("Seed completed successfully!");
  console.log(`
  ===================================
  Admin credentials:
  Email: admin@opscore.io
  Password: admin123
  ===================================
  `);

  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
