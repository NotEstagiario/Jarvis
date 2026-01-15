/**
 * src/prismaClient.js
 *
 * [CRITICAL]
 * Single PrismaClient instance to avoid SQLite locking issues.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = { prisma };
