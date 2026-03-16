import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1FsqsWhtIemG8JzHOactZq0PPwUS6tOmOLrVLPzVD6m8";

  // Helper to fetch public Google Sheet data using native fetch
  async function getSheetData(sheetName: string) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      const startIdx = text.indexOf("{");
      const endIdx = text.lastIndexOf("}");
      
      if (startIdx === -1 || endIdx === -1) {
        console.error(`Invalid JSON format from sheet ${sheetName}`);
        return [];
      }

      const jsonStr = text.substring(startIdx, endIdx + 1);
      const data = JSON.parse(jsonStr);
      
      const rows = data.table.rows;
      return rows.map((row: any) => {
        return row.c.map((cell: any) => {
          if (!cell) return "";
          // Handle cases where cell.v might be null or an object
          if (cell.v === null || cell.v === undefined) return "";
          return String(cell.v);
        });
      });
    } catch (error) {
      console.error(`Error fetching sheet ${sheetName}:`, error);
      return [];
    }
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
          id: index,
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

  app.post("/api/login", async (req, res) => {
    const { nama, password } = req.body;
    if (!nama || !password) {
      return res.status(400).json({ success: false, message: "Nama dan Password harus diisi!" });
    }

    try {
      let rows = await getSheetData("Login");
      
      // Skip header
      if (rows.length > 0 && String(rows[0][1]).toLowerCase().includes("nama")) {
        rows = rows.slice(1);
      }

      const user = rows.find((row: any) => 
        row.length >= 5 &&
        String(row[1]).toLowerCase() === String(nama).toLowerCase() && 
        String(row[2]) === String(password) && 
        String(row[4]).toLowerCase() === "aktif"
      );

      if (user) {
        res.json({ success: true, user: { id: user[0], nama: user[1] } });
      } else {
        res.status(401).json({ success: false, message: "Login Gagal! Cek Nama/Password atau pastikan Status Aktif di Spreadsheet." });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Sistem login sedang bermasalah." });
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
