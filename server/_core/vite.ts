import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  const clientPath = path.resolve(import.meta.dirname, "../..", "client");
  
  app.use(express.static(clientPath));
  
  app.use("*", async (req, res) => {
    const indexHtml = path.resolve(clientPath, "index.html");
    res.sendFile(indexHtml);
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
