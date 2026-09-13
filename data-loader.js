/* ==========================================================
   LOADING SCREEN & OPFS SYNC ENGINE - CONTROLLED FLOW
   ========================================================== */

/* // 1. Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw-guidelines.js')
    .then(() => console.log("Guidelines Service Worker registered successfully."))
    .catch(err => console.error("Error registering Service Worker:", err));
} */

// --- UI CONTROLS ---
function setProgress(percent, message, state = "LOADING") {
    const bar = document.getElementById("bt-progress-bar");
    const textPercent = document.getElementById("bt-percentage");
    const statusText = document.getElementById("sync-status");
    const stateText = document.getElementById("bt-state-text");

    if (bar) bar.style.width = `${percent}%`;
    if (textPercent) textPercent.innerText = `${percent}%`;
    if (statusText && message) statusText.innerText = message;
    if (stateText) stateText.innerText = state;
}

// --- CONFIG & UTILS ---
function getPowerAutomateUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get("data");
        return encoded ? atob(encoded) : null;
    } catch (err) {
        console.error("Invalid Power Automate URL", err);
        return null;
    }
}

async function writeDatasetToOPFS(filename, contentString) {
    const rootDir = await navigator.storage.getDirectory();
    const dataDir = await rootDir.getDirectoryHandle("App_Data", { create: true });
    const fileHandle = await dataDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(contentString);
    await writable.close();
}

async function restoreCacheFromOPFSToLocalStorage() {
    try {
        console.log("📂 Restoring local storage cache from OPFS master source...");
        const rootDir = await navigator.storage.getDirectory();
        const dataDir = await rootDir.getDirectoryHandle("App_Data");
        const fileHandle = await dataDir.getFileHandle("cache_payload.json");
        const file = await fileHandle.getFile();
        const content = await file.text();

        if (content) {
            localStorage.setItem("cache_payload", content);
            console.log("✅ Successfully mirrored OPFS cache to localStorage.");
            return true;
        }
    } catch (err) {
        console.warn("⚠️ No OPFS cache found to restore:", err);
    }
    return false;
}

// --- CORE TASKS WITH CACHE BUSTING & OPFS SYNC ---

async function taskFetchMainData(overrideUrl = null) {
    let baseUrl = overrideUrl || getPowerAutomateUrl();
    if (!baseUrl) throw new Error("No URL provided for main fetch.");
    
    // Aplicación del Cache Busting Token con Date.now()
    const cacheBusterToken = `_cb=${Date.now()}`;
    console.log("⚡ [Cache Busting] Aplicado a principal:", cacheBusterToken);
    const separator = baseUrl.includes('?') ? '&' : '?';
    const finalEndpointUrl = `${baseUrl}${separator}${cacheBusterToken}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(finalEndpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "load" }),
        signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Data fetch error (HTTP ${response.status})`);

    const payload = await response.json();
    const payloadString = JSON.stringify(payload);
    
    await writeDatasetToOPFS("cache_payload.json", payloadString);
    await restoreCacheFromOPFSToLocalStorage();
    
    localStorage.setItem("app_data_version", new Date().toISOString().split("T")[0]);
    localStorage.setItem("app_last_sync_date", new Date().toISOString().split("T")[0]);
    localStorage.setItem("app_last_sync_timestamp", Date.now().toString());
    return payload;
}

async function taskSyncFiles(overrideUrl = null) {
    let baseUrl = overrideUrl || getPowerAutomateUrl();
    if (!baseUrl) return;

    try {
        const rootDir = await navigator.storage.getDirectory();
        
        const cacheBusterToken = `_cb=${Date.now()}`;
        const separator = baseUrl.includes('?') ? '&' : '?';
        const manifestUrl = `${baseUrl}${separator}${cacheBusterToken}`;

        const response = await fetch(manifestUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ action: "READ_MANIFEST" })
        });

        if (!response.ok) return;

        const payload = await response.json();
        const allItems = [
            ...(payload.guidelines || []),
            ...(payload.directory || [])
        ];

        const fileItems = allItems.filter(item => {
            const type = (item.type || "").toLowerCase();
            return type !== "directory" && type !== "folder" && item.name;
        });

        for (const item of fileItems) {
            try {
                let rawPath = item.path || "";
                if (rawPath.endsWith("/") && item.name) {
                    rawPath += item.name;
                } else if (!rawPath.endsWith("/") && !rawPath.endsWith(item.name)) {
                    rawPath = rawPath + "/" + item.name;
                }
                const cleanFilePath = rawPath.replace(/([^:]\/)\/+/g, "$1");

                const targetBaseDir = cleanFilePath.includes("Guidelines_Info") 
                    ? await rootDir.getDirectoryHandle("Guidelines_Info", { create: true })
                    : rootDir;

                let relativeSubFolder = "";
                if (cleanFilePath.includes("Guidelines_Info/")) {
                    const parts = cleanFilePath.split("Guidelines_Info/")[1].split("/");
                    if (parts.length > 1) relativeSubFolder = parts[0];
                } else if (cleanFilePath.includes("Directory/")) {
                    relativeSubFolder = "Directory";
                }

                let currentDirHandle = targetBaseDir;
                if (relativeSubFolder) {
                    currentDirHandle = await targetBaseDir.getDirectoryHandle(relativeSubFolder, { create: true });
                }

                const fileHandle = await currentDirHandle.getFileHandle(item.name, { create: true });

                // Validación inteligente: Verificar si el archivo ya existe y coincide en tamaño para evitar descarga redundante
                try {
                    const existingFile = await fileHandle.getFile();
                    if (existingFile.size > 0 && item.size && existingFile.size === item.size) {
                        console.log(`[OPFS] Omitiendo descarga (sin cambios): ${item.name}`);
                        continue; 
                    }
                } catch (e) {
                    // Si no existe localmente, prosigue con la descarga
                }

                const downloadRes = await fetch(baseUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    cache: "no-store",
                    body: JSON.stringify({ action: "DOWNLOAD_FILE", filePath: cleanFilePath })
                });

                if (downloadRes.ok) {
                    const fileContent = await downloadRes.text();
                    const writable = await fileHandle.createWritable();
                    await writable.write(fileContent);
                    await writable.close();
                    console.log(`[OPFS] Actualizado/Descargado nuevo: ${item.name}`);
                }
            } catch (fileErr) {
                console.warn(`Error procesando archivo individual:`, fileErr);
            }
        }
    } catch (err) {
        console.warn("⚠️ Error en sync secundario de archivos (OPFS):", err);
    }
}

// --- MASTER FLOW CONTROL ---
async function iniciarProcesoCargaTotal() {
    try {
        setProgress(20, "Descargando datos principales del sistema...", "FETCHING");
        await taskFetchMainData();

        setProgress(55, "Sincronizando archivos y directivas (OPFS)...", "SYNCING");
        await taskSyncFiles();

        setProgress(85, "Procesando estructuras locales (ETL)...", "PROCESSING");
        // Disparamos el evento para que data-loader.js procese todo de forma limpia
        window.dispatchEvent(new CustomEvent("PayloadReady"));

        // Todo completado con éxito, revelamos el botón final y bloqueamos acceso prematuro
        setProgress(100, "Sincronización completa", "READY");
        mostrarBotonEntradaApp();

    } catch (err) {
        console.error("Error crítico en la sincronización:", err);
        setProgress(100, "Error en la sincronización. Verifique conexión.", "ERROR");
    }
}

function mostrarBotonEntradaApp() {
    const footerPanel = document.getElementById('sync-footer-panel');
    if (!footerPanel) return;
    
    footerPanel.innerHTML = `
        <button id="enter-app-btn" style="width: 100%; padding: 10px; background: #38bdf8; color: #0f172a; border: none; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);">
            🚀 Enter Main Application
        </button>
    `;
    
    document.getElementById('enter-app-btn').onclick = () => {
        window.location.replace('index.html' + window.location.search);
    };
}

/* // Inicialización automática al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    iniciarProcesoCargaTotal();
}); */