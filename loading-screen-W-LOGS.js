/* ==========================================================
   LOADING SCREEN & OPFS SYNC ENGINE (SQUADRON EDITION)
   ========================================================== */

// --- 🔴 RED LEADER: COMMAND & ROUTER ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw-guidelines.js')
    .then(() => console.log("🔴 [Red Leader]: Guidelines Service Worker registered successfully, standing by."))
    .catch(err => console.error("💥 [Red Leader Down]: Error registering Service Worker:", err));
}

// Menú / Enrutador maestro estilo Escuadrón Rojo
async function red_leader(steps = [0, 1, 3, 4]) {
    console.log("🔴 [Red Leader]: Red Leader, standing by. Flight path requested:", steps);
    try {
        if (steps.includes(0)) {
            console.log("🟡 [Gold Leader]: Engaging security sweep (SharePoint session verification)...");
            const sessionActive = await verifySharePointSession();
            if (!sessionActive) throw new Error("Security breach: Session expired.");
        }

        if (steps.includes(1)) {
            console.log("🔴 [Red Leader]: Commencing main trench run (fetching and processing core data)...");
            const success = await fetchAndProcessData(true);
            if (!success) throw new Error("Synchronization process failed.");
        }

        if (steps.includes(3)) {
            console.log("🔵 [Blue Leader]: Lock S-foils in attack position (executing step 3)...");
            if (typeof initializeInteractiveMap === 'function') {
                initializeInteractiveMap();
            }
        }

        if (steps.includes(4)) {
            console.log("🔵 [Blue Leader]: Target area reached. Get out of there, you're clear!");
            if (typeof showAppEntryButton === 'function') {
                showAppEntryButton();
            }
        }
    } catch (err) {
        console.error("💥 [Red Leader]: Mission error encountered:", err.message);
    }
}
window.red_leader = red_leader;


// --- 🔵 BLUE LEADER: UI & HUD TELEMETRY ---
function updateProgress(percent, message, state = "LOADING") {
    const bar = document.getElementById("bt-progress-bar");
    const textPercent = document.getElementById("bt-percentage");
    const statusText = document.getElementById("sync-status");
    const stateText = document.getElementById("bt-state-text");

    if (bar) bar.style.width = `${percent}%`;
    if (textPercent) textPercent.innerText = `${percent}%`;
    if (statusText && message) statusText.innerText = message;
    if (stateText) stateText.innerText = state;
}

function showSplash(splashElement) {
    if (!splashElement) return;
    console.log("🔵 [Blue Leader]: Raising deflector shields (showing splash screen)...");
    splashElement.style.pointerEvents = "auto";
    splashElement.style.display = "flex";
    splashElement.style.opacity = "1";
}

function hideSplash(splashElement) {
    if (!splashElement) return;
    console.log("🔵 [Blue Leader]: Lowering shields, getting out of there!");
    splashElement.style.opacity = "0";
    splashElement.style.pointerEvents = "none";
    setTimeout(() => { 
        splashElement.style.display = "none"; 
        if (window.AppMap && typeof window.AppMap.invalidateSize === 'function') {
            window.AppMap.invalidateSize();
        }
    }, 400);
}

function getPowerAutomateUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get("data");
        return encoded ? atob(encoded) : null;
    } catch (err) {
        console.error("💥 [Blue Leader]: Invalid Power Automate URL", err);
        return null;
    }
}


// --- 🟡 GOLD LEADER: SECURITY & AUTHENTICATION ---
function checkSharePointLogo() {
    console.log("🟡 [Gold Leader]: Scanning target signature (SharePoint logo check), standing by...");
    return new Promise((resolve) => {
        const logoUrl = "https://clinicasdelcaminoreal.sharepoint.com/sites/CDCROperationsHub/_api/siteiconmanager/getsitelogo?type=%271%27&hash=639204304455530335";
        const img = new Image();
        
        const timeout = setTimeout(() => {
            img.src = "";
            console.warn("🟡 [Gold Leader]: Target scan timed out.");
            resolve(false);
        }, 4000);

        img.onload = () => { clearTimeout(timeout); console.log("🟡 [Gold Leader]: Target acquired! Session active."); resolve(true); };
        img.onerror = () => { clearTimeout(timeout); console.warn("🟡 [Gold Leader]: Target visual lost."); resolve(false); };

        img.src = logoUrl + "&t=" + new Date().getTime();
    });
}

async function verifySharePointSession() {
    console.log("🟡 [Gold Leader]: Checking SharePoint session...");
    let active = await checkSharePointLogo();
    if (active) return true;

    await new Promise(r => setTimeout(r, 800));
    active = await checkSharePointLogo();
    if (active) return true;

    console.warn("🟡 [Gold Leader]: Session expired. Triggering automatic login lock screen.");
    triggerAutomaticLoginFlow();
    return false;
}

function triggerAutomaticLoginFlow() {
    console.log("🟡 [Gold Leader]: Deploying authentication lock screen...");
    const splash = document.getElementById("sync-splash");
    if (splash) splash.style.display = "none";

    if (document.getElementById("sp-lock-screen")) return;

    const lockScreen = document.createElement("div");
    lockScreen.id = "sp-lock-screen";
    lockScreen.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.98); z-index: 999999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: white; font-family: system-ui, sans-serif; text-align: center; padding: 20px;
    `;
    
    const sharePointSiteUrl = "https://clinicasdelcaminoreal.sharepoint.com/sites/CDCROperationsHub";

    lockScreen.innerHTML = `
        <div style="max-width: 440px; background: #1e293b; padding: 35px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155;">
            <h2 style="margin-top: 0; color: #f87171; font-size: 22px;">Sign-In Required / Offline</h2>
            <p id="lock-status-text" style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Your corporate session could not be verified automatically. Authenticate via popup or continue in offline mode using local OPFS backups.
            </p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #38bdf8; font-size: 13px; font-weight: 500; margin-bottom: 20px;">
                <div style="width: 14px; height: 14px; border: 2px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                Waiting for authentication...
            </div>
            
            <button id="btn-offline-mode" style="background: #0284c7; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; margin-bottom: 10px;">
                🔓 Continue in Offline Mode (Use OPFS Cache)
            </button>
            <button id="btn-reopen-popup" style="background: #334155; color: #cbd5e1; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;">
                Reopen Login Window
            </button>
        </div>
        <style> @keyframes spin { to { transform: rotate(360deg); } } </style>
    `;
    
    document.body.appendChild(lockScreen);

    let loginWindow = null;
    const openPopup = () => {
        console.log("🟡 [Gold Leader]: Opening authentication popup window...");
        const width = 600, height = 700;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);
        loginWindow = window.open(sharePointSiteUrl, "SharePointLoginPopup", `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
    };

    openPopup();
    
    document.getElementById("btn-reopen-popup").addEventListener("click", () => {
        if (!loginWindow || loginWindow.closed) openPopup();
    });

    document.getElementById("btn-offline-mode").addEventListener("click", async () => {
        console.log("🔓 [Gold Leader]: User requested offline mode bypass. Getting out of lock screen!");
        try { if (loginWindow && !loginWindow.closed) loginWindow.close(); } catch (e) {}
        lockScreen.remove();
        
        const restored = await restoreCacheFromOPFSToLocalStorage();
        if (restored || localStorage.getItem("cache_payload")) {
            console.log("✅ [Gold Leader]: Offline mode engaged successfully.");
            window.dispatchEvent(new CustomEvent("PayloadReady"));
        } else {
            alert("No local OPFS backup found. Internet connection and authentication are required for the first run.");
            triggerAutomaticLoginFlow();
        }
    });

    const sessionPollInterval = setInterval(async () => {
        if (await checkSharePointLogo()) {
            console.log("🟡 [Gold Leader]: Session detected. Closing popup and continuing...");
            clearInterval(sessionPollInterval);
            try { if (loginWindow && !loginWindow.closed) loginWindow.close(); } catch (e) {}
            lockScreen.remove();
            checkAndSyncData();
        }
    }, 2000);
}


// --- 🟢 GREEN LEADER: OPFS & STORAGE ENGINEERING ---
function clearLocalDatasetsCache() {
    console.log("🟢 [Green Leader]: Purgando exclusivamente los datasets de caché en localStorage...");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("csv_") || key === "cache_payload")) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
}

async function writeDatasetToOPFS(filename, contentString) {
    console.log("🟢 [Green Leader]: Stowing cargo safely into OPFS bay:", filename);
    const rootDir = await navigator.storage.getDirectory();
    const dataDir = await rootDir.getDirectoryHandle("App_Data", { create: true });
    
    const fileHandle = await dataDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(contentString);
    await writable.close();
}

async function restoreCacheFromOPFSToLocalStorage() {
    try {
        console.log("🟢 [Green Leader]: 📂 Restoring local storage cache from OPFS master source...");
        const rootDir = await navigator.storage.getDirectory();
        const dataDir = await rootDir.getDirectoryHandle("App_Data");
        const fileHandle = await dataDir.getFileHandle("cache_payload.json");
        const file = await fileHandle.getFile();
        const content = await file.text();

        if (content) {
            localStorage.setItem("cache_payload", content);
            console.log("✅ [Green Leader]: Successfully mirrored OPFS cache to localStorage.");
            return true;
        }
    } catch (err) {
        console.warn("⚠️ [Green Leader]: No OPFS cache found to restore:", err);
    }
    return false;
}


// --- MAIN FETCH ENGINE (OPFS as Master Source) ---
async function fetchAndProcessData(isManual = false) {
    const splash = document.getElementById("sync-splash");
    if (isManual) showSplash(splash);
    
    try {
        updateProgress(20, "Loading core application records from cloud...", "CONNECTING");
        
        let baseUrl = getPowerAutomateUrl();
        if (!baseUrl) {
            hideSplash(splash);
            return false;
        }
        
        const csvController = new AbortController();
        const csvTimeout = setTimeout(() => csvController.abort(), 35000);

        const csvResponse = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), 
            signal: csvController.signal
        });
        clearTimeout(csvTimeout);

        if (!csvResponse.ok) throw new Error(`Data fetch error (HTTP ${csvResponse.status})`);

        const csvPayload = await csvResponse.json();
        const payloadString = JSON.stringify(csvPayload);
        
        clearLocalDatasetsCache();
        await writeDatasetToOPFS("cache_payload.json", payloadString);
        await restoreCacheFromOPFSToLocalStorage();
        
        localStorage.setItem("app_data_version", new Date().toISOString().split("T")[0]);
        localStorage.setItem("app_last_sync_date", new Date().toISOString().split("T")[0]);
        localStorage.setItem("app_last_sync_timestamp", Date.now().toString());

        updateProgress(100, "Ready!", "READY");

        setTimeout(() => {
            hideSplash(splash);
            window.dispatchEvent(new CustomEvent("PayloadReady"));
        }, 300);

        // (Background sync call removed as requested)

        return true;

    } catch (error) {
        updateProgress(100, error.message || "Synchronization Error", "ERROR");
        setTimeout(() => hideSplash(splash), 1500);
        return false;
    }
}


// --- LIFECYCLE BOOTSTRAP & OFFLINE FALLBACK ---
async function checkAndSyncData() {
    const splash = document.getElementById("sync-splash");
    const lastTimestamp = parseInt(localStorage.getItem("app_last_sync_timestamp") || "0", 10);
    const hasLocalPayload = localStorage.getItem("cache_payload");

    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();

    const needsLoadingScreen = !lastTimestamp || (now - lastTimestamp >= ONE_HOUR_MS) || !hasLocalPayload;

    if (!needsLoadingScreen) {
        if (splash) splash.style.display = "none";
        window.dispatchEvent(new CustomEvent("PayloadReady"));
        return; // 🛑 Cero descargas en segundo plano aquí
    }

    const sessionActive = await verifySharePointSession().catch(() => false);
    
    if (!sessionActive) {
        if (splash) splash.style.display = "none";
        const restored = await restoreCacheFromOPFSToLocalStorage();
        if (restored || hasLocalPayload) {
            window.dispatchEvent(new CustomEvent("PayloadReady"));
        } else {
            updateProgress(100, "Connection Error & No Local Backup", "ERROR");
        }
        return;
    }

    try {
        const success = await fetchAndProcessData(true);
        if (!success) {
            await restoreCacheFromOPFSToLocalStorage();
            if (splash) splash.style.display = "none";
            window.dispatchEvent(new CustomEvent("PayloadReady"));
        }
    } catch (error) {
        await restoreCacheFromOPFSToLocalStorage();
        if (splash) splash.style.display = "none";
        window.dispatchEvent(new CustomEvent("PayloadReady"));
    }
}


// --- MONITOR DE INACTIVIDAD ---
let awayTimer = null;
const AWAY_THRESHOLD_MS = 20 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function initAwaySyncMonitor() {
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            awayTimer = setTimeout(async () => {
                const lastTimestamp = parseInt(localStorage.getItem("app_last_sync_timestamp") || "0", 10);
                const elapsed = Date.now() - lastTimestamp;
                
                if (elapsed < ONE_HOUR_MS) return;

                const sessionActive = await checkSharePointLogo().catch(() => false);
                if (sessionActive) {
                    localStorage.setItem("pending_auto_sync", "true");
                }
            }, AWAY_THRESHOLD_MS);
            
        } else {
            if (awayTimer) {
                clearTimeout(awayTimer);
                awayTimer = null;
            }

            if (localStorage.getItem("pending_auto_sync") === "true") {
                localStorage.removeItem("pending_auto_sync");
                if (typeof window.triggerManualSync === 'function') {
                    window.triggerManualSync();
                }
            }
        }
    });
}

window.triggerManualSync = async function() {
    console.log("🚨 [Red Leader]: Manual sync override initiated!");
    localStorage.removeItem("app_last_sync_date");
    localStorage.removeItem("app_last_sync_timestamp");
    clearLocalDatasetsCache();
    
    if (await verifySharePointSession()) {
        const success = await fetchAndProcessData(true);
        
        if (success) {
            await new Promise(resolve => setTimeout(resolve, 900));
            const freshUrl = new URL(window.location.href);
            freshUrl.searchParams.set('reload_ts', Date.now());
            window.location.href = freshUrl.toString();
        } else {
            alert("⚠️ La sincronización no pudo completarse correctamente.");
        }
    } else {
        alert("⚠️ No se pudo verificar la sesión activa con SharePoint.");
    }
};

window.addEventListener("DOMContentLoaded", () => {
    checkAndSyncData();
    initAwaySyncMonitor();
});