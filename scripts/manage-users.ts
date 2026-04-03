import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function printUser(user: { id: string; email: string; createdAt: Date }) {
  console.log(`  ${user.email}  (id: ${user.id}, created: ${user.createdAt.toISOString().split("T")[0]})`);
}

async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  if (users.length === 0) {
    console.log("\nNo users found.\n");
    return;
  }
  console.log(`\n${users.length} user(s):\n`);
  for (const user of users) printUser(user);
  console.log();
}

async function searchUsers() {
  const query = await ask("Search (email): ");
  if (!query.trim()) return;

  const users = await prisma.user.findMany({
    where: { email: { contains: query.trim(), mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });

  if (users.length === 0) {
    console.log(`\nNo users matching "${query.trim()}".\n`);
    return;
  }
  console.log(`\n${users.length} result(s):\n`);
  for (const user of users) printUser(user);
  console.log();
}

async function createUser() {
  const email = await ask("Email: ");
  if (!email.trim()) return;

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    console.log(`\nUser ${email.trim()} already exists.\n`);
    return;
  }

  const passwordInput = await ask("Password (leave empty to generate): ");
  const password = passwordInput || randomBytes(16).toString("base64url");
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email: email.trim(), hashedPassword: hashed },
  });

  console.log(`\nCreated: ${user.email} (id: ${user.id})`);
  if (!passwordInput) {
    console.log(`Generated password: ${password}`);
  }
  console.log();
}

async function removeUser() {
  const email = await ask("Email to remove: ");
  if (!email.trim()) return;

  const user = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!user) {
    console.log(`\nNo user found with email "${email.trim()}".\n`);
    return;
  }

  const confirm = await ask(`Delete ${user.email}? (y/N): `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Cancelled.\n");
    return;
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted ${user.email}.\n`);
}

async function resetPassword() {
  const email = await ask("Email: ");
  if (!email.trim()) return;

  const user = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!user) {
    console.log(`\nNo user found with email "${email.trim()}".\n`);
    return;
  }

  const passwordInput = await ask("New password (leave empty to generate): ");
  const password = passwordInput || randomBytes(16).toString("base64url");
  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({ where: { id: user.id }, data: { hashedPassword: hashed } });

  console.log(`\nPassword updated for ${user.email}.`);
  if (!passwordInput) {
    console.log(`Generated password: ${password}`);
  }
  console.log();
}

const actions: Record<string, { label: string; fn: () => Promise<void> }> = {
  "1": { label: "List users", fn: listUsers },
  "2": { label: "Search users", fn: searchUsers },
  "3": { label: "Create user", fn: createUser },
  "4": { label: "Remove user", fn: removeUser },
  "5": { label: "Reset password", fn: resetPassword },
};

async function main() {
  console.log("\n--- InvoiceMe User Manager ---\n");

  while (true) {
    for (const [key, { label }] of Object.entries(actions)) {
      console.log(`  ${key}. ${label}`);
    }
    console.log("  q. Quit\n");

    const choice = await ask("> ");

    if (choice.trim().toLowerCase() === "q") break;

    const action = actions[choice.trim()];
    if (action) {
      await action.fn();
    } else {
      console.log("Invalid option.\n");
    }
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
