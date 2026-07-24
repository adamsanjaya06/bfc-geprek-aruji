import express from "express";
import rawFirebaseConfig from "../firebase-applet-config.json" with { type: "json" };

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Firestore REST endpoint configuration
const firestoreConfig = rawFirebaseConfig as any;
const firestoreRestUrl = `https://firestore.googleapis.com/v1/projects/${firestoreConfig.projectId}/databases/${firestoreConfig.firestoreDatabaseId}/documents/app_state/main_store?key=${firestoreConfig.apiKey}`;

let memoryCache: any = {
  products: [],
  ingredients: [],
  sales: [],
  expenses: [],
  wastage: [],
  storeSettings: {
    storeName: "BFC Geprek Aruji",
    storeTagline: "Berkah Fried Chicken",
    storeAddress: "Jl. Paha Dada Krispi No. 99, Jakarta Barat",
    storePhone: "0812-3456-7890",
  },
  users: []
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: "vercel" });
});

app.get("/api/sync/state", async (_req, res) => {
  try {
    const response = await fetch(firestoreRestUrl);
    if (response.ok) {
      const docData = await response.json();
      if (docData && docData.fields && docData.fields.jsonState && docData.fields.jsonState.stringValue) {
        const state = JSON.parse(docData.fields.jsonState.stringValue);
        memoryCache = { ...memoryCache, ...state };
        return res.json({ status: "ok", ...memoryCache, fallback: false });
      }
    }
  } catch (err) {
    console.warn("Vercel Serverless Firestore GET error:", err);
  }
  return res.json({ status: "ok", ...memoryCache, fallback: true });
});

app.post("/api/sync/state", async (req, res) => {
  try {
    const body = req.body || {};
    memoryCache = {
      ...memoryCache,
      ...body
    };

    const patchUrl = `${firestoreRestUrl}?updateMask.fieldPaths=jsonState`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          jsonState: { stringValue: JSON.stringify(memoryCache) }
        }
      })
    });

    if (patchRes.ok) {
      return res.json({ status: "ok", ...memoryCache, fallback: false });
    } else {
      console.warn("Firestore PATCH response status:", patchRes.status);
      return res.json({ status: "ok", ...memoryCache, fallback: true });
    }
  } catch (err) {
    console.error("Vercel Serverless Firestore POST error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

export default app;
