import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1FsqsWhtIemG8JzHOactZq0PPwUS6tOmOLrVLPzVD6m8";

  // Helper to fetch public Google Sheet data
  async function getSheetData(sheetName: string) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
      const response = await fetch(url);
      const text = await response.text();
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const data = JSON.parse(jsonStr);
      
      const rows = data.table.rows;
      // Map rows and handle potential null cells or objects
      return rows.map((row: any) => {
        return row.c.map((cell: any) => {
          if (!cell) return "";
          return cell.v !== null && cell.v !== undefined ? String(cell.v) : "";
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
      if (rows.length > 0 && rows[0][0] === "timestamp") {
        rows = rows.slice(1);
      }

      const furniture = rows
        .filter((row: any) => row.length >= 9 && row[1] !== "") // Filter empty rows
        .map((row: any, index: number) => ({
          id: index,
          timestamp: row[0],
          kategori: row[1],
          harga: row[2],
          diskon: row[3],
          tanggal_diskon_sampai: row[4],
          keterangan: row[5],
          stock: row[6],
          status: row[7],
          photo64base: row[8],
        })).reverse(); 

      res.json(furniture);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch furniture data" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { nama, password } = req.body;
    try {
      const rows = await getSheetData("Login");
      
      // Find user matching credentials and status 'aktif'
      // Indices: 0:id, 1:nama, 2:password, 3:tgl_login, 4:Status
      const user = rows.find((row: any) => 
        row.length >= 5 &&
        row[1].toLowerCase() === nama.toLowerCase() && 
        row[2] === password && 
        row[4].toLowerCase() === "aktif"
      );

      if (user) {
        res.json({ success: true, user: { id: user[0], nama: user[1] } });
      } else {
        res.status(401).json({ success: false, message: "Login Gagal, Bosku. Cek Nama/Password atau Status Aktif." });
      }
    } catch (error) {
      res.status(500).json({ error: "Login system error" });
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
