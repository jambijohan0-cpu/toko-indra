import express from "express";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const WEB_APP_URL = process.env.WEB_APP_URL;

// Fungsi utama untuk ambil data dari Google Apps Script
async function getSheetData(sheetName: string) {
  if (!WEB_APP_URL) {
    throw new Error("WEB_APP_URL belum diatur!");
  }
  try {
    const url = `${WEB_APP_URL}${WEB_APP_URL.includes('?') ? '&' : '?'}sheet=${sheetName}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Apps Script Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Gagal ambil data ${sheetName}:`, error);
    return [];
  }
}

// Helper to post data to Apps Script
async function postToSheet(action: string, data: any, id?: any) {
  if (!WEB_APP_URL) throw new Error("WEB_APP_URL belum dikonfigurasi");
  const response = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data, id, sheet: "Gambar" }),
  });
  return await response.json();
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", webAppUrlSet: !!WEB_APP_URL });
});

// API Routes
app.get("/api/furniture", async (req, res) => {
  try {
    let rows: any = await getSheetData("Gambar");
    
    if (Array.isArray(rows) && rows.length > 0 && String(rows[0][0]).toLowerCase().includes("timestamp")) {
      rows = rows.slice(1);
    }

    const furniture = (Array.isArray(rows) ? rows : [])
      .filter((row: any) => row.length >= 2 && row[1] !== "")
      .map((row: any) => ({
        id: row[0],
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

app.post("/api/furniture", async (req, res) => {
  try {
    const { kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base } = req.body;
    const timestamp = new Date().toISOString();
    const rowData = [timestamp, kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base];
    const result = await postToSheet("add", rowData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Gagal menambah data" });
  }
});

app.put("/api/furniture/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base } = req.body;
    const rowData = [id, kategori, harga, diskon, tanggal_diskon_sampai, keterangan, stock, status, photo64base];
    const result = await postToSheet("update", rowData, id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Gagal update data" });
  }
});

app.delete("/api/furniture/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await postToSheet("delete", [], id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Gagal menghapus data" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!WEB_APP_URL) return res.status(500).json({ success: false, message: "WEB_APP_URL belum diatur!" });

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });

    const result: any = await response.json();
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: result.error || "Username atau Password salah!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal terhubung ke database." });
  }
});

// Development vs Production logic
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
