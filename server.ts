import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const WEB_APP_URL = process.env.WEB_APP_URL;

  // Helper to fetch data (Supports Apps Script or Public Gviz)
  async function getSheetData(sheetName: string) {
    try {
      // Use Apps Script if provided (More stable & secure)
      if (WEB_APP_URL) {
        const url = `${WEB_APP_URL}${WEB_APP_URL.includes('?') ? '&' : '?'}sheet=${sheetName}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Apps Script Error: ${response.status}`);
        return await response.json();
      }

      // Fallback message if no URL configured
      console.error("WEB_APP_URL tidak ditemukan di Environment Variables!");
      return [];
    } catch (error) {
      console.error(`Error fetching sheet ${sheetName}:`, error);
      return [];
    }
  }

  // Helper to post data to Apps Script
  async function postToSheet(action: string, data: any, id?: any) {
    if (!WEB_APP_URL) throw new Error("WEB_APP_URL belum dikonfigurasi di Vercel");
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data, id, sheet: "Gambar" }),
    });
    return await response.json();
  }

  // API Routes
  app.get("/api/furniture", async (req, res) => {
    try {
      let rows = await getSheetData("Gambar");
      
      // Skip header if first row looks like header
      if (rows.length > 0 && String(rows[0][0]).toLowerCase().includes("timestamp")) {
        rows = rows.slice(1);
      }

      const furniture = rows
        .filter((row: any) => row.length >= 2 && row[1] !== "") // Filter empty rows
        .map((row: any, index: number) => ({
          id: row[0], // Use timestamp as ID
          timestamp: row[0] || "",
          kategori: row[1] || "Uncategorized",
          harga: row[2] || "Rp 0",
          diskon: row[3] || "",
          tanggal_diskon_sampai: row[4] || "",
          keterangan: row[5] || "",
          stock: row[6] || "0",
          status: row[7] || "Ready",
          photo64base: row[8] || "",
        })).reverse(); 

      res.json(furniture);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil data furniture" });
    }
  });

  // Add Furniture
  app.post("/api/furniture", async (req, res) => {
    try {
      const { kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base } = req.body;
      const timestamp = new Date().toISOString();
      const rowData = [timestamp, kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base];
      const result = await postToSheet("add", rowData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Gagal menambah data" });
    }
  });

  // Update Furniture
  app.put("/api/furniture/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base } = req.body;
      const rowData = [id, kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base];
      const result = await postToSheet("update", rowData, id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Gagal update data" });
    }
  });

  // Delete Furniture
  app.delete("/api/furniture/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await postToSheet("delete", [], id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Gagal menghapus data" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!WEB_APP_URL) {
      return res.status(500).json({ success: false, message: "WEB_APP_URL belum diatur di Settings!" });
    }

    try {
      const response = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "login", 
          username: username, 
          password: password 
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Google Response Not JSON:", text);
        throw new Error("Respon dari Google bukan format JSON. Cek apakah Script sudah di-Deploy sebagai Web App.");
      }

      const result = await response.json();
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: result.error || "Username atau Password salah!" });
      }
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Gagal terhubung ke database. Cek URL Apps Script!" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
