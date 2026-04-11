#!/usr/bin/env node

/**
 * build.js — Secret Chat
 *
 * Gera um hash SHA-256 a partir dos arquivos do app e injeta como
 * versão do cache no sw.js antes do deploy.
 *
 * Uso:
 *   node build.js
 *
 * Adicione ao package.json:
 *   "scripts": { "build": "node build.js" }
 *
 * Build command: node build.js
 */

const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

// Arquivos que, se mudarem, devem quebrar o cache
const FILES_TO_HASH = [
  "index.html",
  "admin.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "favicon.ico",
];

// Gera hash SHA-256 dos arquivos combinados
function generateHash() {
  const hash = crypto.createHash("sha256");

  for (const file of FILES_TO_HASH) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[build] Aviso: ${file} não encontrado, ignorando.`);
      continue;
    }
    hash.update(fs.readFileSync(filePath));
  }

  return hash.digest("hex").slice(0, 8);
}

// Injeta a versão no sw.js
function injectVersion(version) {
  const swPath = path.join(__dirname, "sw.js");

  if (!fs.existsSync(swPath)) {
    console.error("[build] ERRO: sw.js não encontrado.");
    process.exit(1);
  }

  let content = fs.readFileSync(swPath, "utf8");

  // Suporta tanto o placeholder quanto uma versão já injetada anteriormente
  content = content.replace(
    /const CACHE_NAME = "secret-chat-[^"]+";/,
    `const CACHE_NAME = "secret-chat-${version}";`
  );

  fs.writeFileSync(swPath, content, "utf8");
  console.log(`[build] Cache version: secret-chat-${version}`);
}

const version = generateHash();
injectVersion(version);
console.log("[build] sw.js atualizado com sucesso.");
