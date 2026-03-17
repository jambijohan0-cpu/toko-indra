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

const formatRupiah = (val: any) => {
  if (!val) return "Rp 0";
  if (typeof val === 'string' && val.includes('Rp')) return val;
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num).replace('IDR', 'Rp');
};

const getGaulLabel = () => {
  const labels = ["POTONGAN GOKIL!", "HEMAT PARAH!", "CUAN BANGET!", "DISKON SADIS!", "HARGA MIRING!"];
  return labels[Math.floor(Math.random() * labels.length)];
};

// API Routes
app.get("/api/furniture", async (req, res) => {
  try {
    const data = await getSheetData("Gambar");
    let rows: any[] = Array.isArray(data) ? data : [];
    
    if (rows.length > 0 && Array.isArray(rows[0]) && String(rows[0][0]).toLowerCase().includes("timestamp")) {
      rows = rows.slice(1);
    }

    const furniture = rows
      .filter((row: any) => Array.isArray(row) && row.length >= 2 && row[1] !== "")
      .map((row: any) => {
        const hargaNormal = typeof row[2] === 'number' ? row[2] : parseInt(String(row[2]).replace(/[^0-9]/g, ''), 10) || 0;
        const diskonNominal = typeof row[3] === 'number' ? row[3] : parseInt(String(row[3]).replace(/[^0-9]/g, ''), 10) || 0;
        const hargaFinal = hargaNormal - diskonNominal;

        return {
          id: row[0],
          timestamp: row[0] || "",
          kategori: row[1] || "Uncategorized",
          harga: formatRupiah(hargaFinal),
          harga_asli: diskonNominal > 0 ? formatRupiah(hargaNormal) : "",
          diskon: diskonNominal > 0 ? formatRupiah(diskonNominal) : "",
          gaul_label: diskonNominal > 0 ? getGaulLabel() : "",
          tanggal_diskon_sampai: row[4] || "",
          keterangan: row[5] || "",
          stock: row[6] || "0",
          status: row[7] || "Ready",
          photo64base: row[8] || "",
        };
      }).reverse(); 

    res.json(furniture);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data furniture" });
  }
});

app.get("/api/promo", async (req, res) => {
  try {
    const data = await getSheetData("Promo");
    let rows: any[] = Array.isArray(data) ? data : [];
    
    if (rows.length > 0 && Array.isArray(rows[0]) && String(rows[0][0]).toLowerCase().includes("promo")) {
      rows = rows.slice(1);
    }

    const promos = rows
      .filter((row: any) => Array.isArray(row) && row.length >= 2 && row[0] !== "")
      .map((row: any) => {
        let diskon = row[1];
        // Handle conversion from decimal (0.4) to percentage (40%)
        if (typeof diskon === 'number' && diskon <= 1 && diskon > 0) {
          diskon = Math.round(diskon * 100) + "%";
        } else if (diskon !== null && diskon !== undefined) {
          diskon = String(diskon);
          if (!diskon.includes('%') && !isNaN(Number(diskon))) {
            const num = Number(diskon);
            if (num <= 1 && num > 0) diskon = Math.round(num * 100) + "%";
          }
        }
        return {
          text: row[0],
          diskon: diskon || "0%"
        };
      });

    res.json(promos);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data promo" });
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

    const result = await response.json() as { success?: boolean; error?: string };
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
