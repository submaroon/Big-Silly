/**
 * Big Five Fewshot Injector for SillyTavern
 * -----------------------------------------
 * - Загружает big_five_fewshots.json из корня расширения
 * - Даёт UI со всеми контролами
 * - Подмешивает инжект в отправляемые пользователем сообщения
 * - Поддерживает: выбор подличностей, интервал, глубину, тип сообщения
 */

(function () {
    const TRAITS = [
        "Openness",
        "Conscientiousness",
        "Extraversion",
        "Agreeableness",
        "Neuroticism"
    ];

    let dataset = null;
    let messageCounter = 0;

    // -------------------------
    // Settings (with defaults)
    // -------------------------
    const settings = {
        enabled: false,
        injector: "system",     // system | user | assistant
        depth: 1,
        interval: 1,
        levels: {
            Openness: "2",
            Conscientiousness: "2",
            Extraversion: "2",
            Agreeableness: "2",
            Neuroticism: "2"
        }
    };

    const STORAGE_KEY = "bigfive_fewshots_settings";

    // Load from localStorage
    function loadSavedSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            Object.assign(settings, parsed);
        } catch (e) {
            console.error("[BigFive] Failed to load settings:", e);
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    // -------------------------
    // Dataset loader
    // -------------------------

    async function loadDataset() {
        try {
            // Fetch JSON from extension's local directory
            const url = `${extensionFolderPath}/big_five_fewshots.json`;
            const response = await fetch(url);
            dataset = await response.json();
            console.log("[BigFive] Dataset loaded:", dataset.length, "items");
        } catch (e) {
            console.error("[BigFive] Failed to load dataset:", e);
        }
    }

    function getSamplesFor(trait, level) {
        if (!dataset) return [];
        const result = [];

        for (const q of dataset) {
            if (q.traits && q.traits[trait] && q.traits[trait][level] !== undefined) {
                result.push(q.traits[trait][level]);
            }
        }

        return result;
    }

    function pickRandom(arr) {
        if (!arr || arr.length === 0) return "[NO SAMPLE]";
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // Build full personality injection block
    function buildInjectionBlock() {
        let text = `Ниже приведены ПРИМЕРЫ МЫШЛЕНИЯ (Personality Snapshots) этого персонажа.
Используй эти примеры ТОЛЬКО для копирования тона, стиля речи, длины предложений и хода мыслей.
НЕ используй ситуации или предметы из примеров в текущем ролеплее.

`;

        for (const trait of TRAITS) {
            const level = settings.levels[trait];
            const arr = getSamplesFor(trait, level);
            const sample = pickRandom(arr);
            text += sample + "\n\n";
        }

        return text.trim();
    }

    // -------------------------
    // Injection logic
    // -------------------------

    function doInjection(userMessageObject) {
        let injectionText = "";
        const depth = parseInt(settings.depth) || 1;

        for (let i = 0; i < depth; i++) {
            injectionText += buildInjectionBlock();
            if (i < depth - 1) injectionText += "\n\n";
        }

        if (settings.injector === "system") {
            userMessageObject.system = injectionText + "\n\n" + (userMessageObject.system ?? "");
        } else if (settings.injector === "assistant") {
            userMessageObject.messages.unshift({
                role: "assistant",
                content: injectionText
            });
        } else {
            // injector === "user" → prepend synthetic user message
            userMessageObject.messages.unshift({
                role: "user",
                content: injectionText
            });
        }
    }

    // Hook ST event: whenever the user sends a message
    function setupOutgoingHook() {
        const evt = stEventBus; // SillyTavern global event bus

        evt.on("userMessageWillSend", (payload) => {
            messageCounter++;

            if (!settings.enabled) return;
            if (messageCounter % settings.interval !== 0) return;

            doInjection(payload);
        });
    }

    // -------------------------
    // UI PANEL
    // -------------------------

    function createUI() {
        const panel = document.createElement("div");
        panel.style.padding = "10px";
        panel.innerHTML = `
            <h3>Big Five Fewshots</h3>

            <label>
                <input type="checkbox" id="bf_enabled">
                Включить инжекты
            </label>
            <br><br>

            <label>
                Инжектор:
                <select id="bf_injector">
                    <option value="system">system</option>
                    <option value="user">user</option>
                    <option value="assistant">assistant</option>
                </select>
            </label>
            <br><br>

            <label>
                Глубина (depth):
                <input type="number" id="bf_depth" min="1" value="1" style="width:60px;">
            </label>
            <br><br>

            <label>
                Интервал (каждые N сообщений):
                <input type="number" id="bf_interval" min="1" value="1" style="width:60px;">
            </label>

            <hr>

            <div id="bf_traits"></div>

            <button id="bf_test_button" style="margin-top:10px;">Показать тестовый инжект в консоли</button>
        `;

        // Insert trait selectors
        const traitBlock = panel.querySelector("#bf_traits");
        TRAITS.forEach(trait => {
            const row = document.createElement("div");
            row.innerHTML = `
                <label>${trait}: </label>
                <select id="bf_${trait}">
                    <option value="0">Level 0</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                </select>
            `;
            traitBlock.appendChild(row);
        });

        // Load saved
        panel.querySelector("#bf_enabled").checked = settings.enabled;
        panel.querySelector("#bf_injector").value = settings.injector;
        panel.querySelector("#bf_depth").value = settings.depth;
        panel.querySelector("#bf_interval").value = settings.interval;

        TRAITS.forEach(t => {
            panel.querySelector(`#bf_${t}`).value = settings.levels[t];
        });

        // Bind events
        panel.querySelector("#bf_enabled").addEventListener("change", (e) => {
            settings.enabled = e.target.checked;
            saveSettings();
        });

        panel.querySelector("#bf_injector").addEventListener("change", (e) => {
            settings.injector = e.target.value;
            saveSettings();
        });

        panel.querySelector("#bf_depth").addEventListener("input", (e) => {
            settings.depth = e.target.value;
            saveSettings();
        });

        panel.querySelector("#bf_interval").addEventListener("input", (e) => {
            settings.interval = e.target.value;
            saveSettings();
        });

        TRAITS.forEach(t => {
            panel.querySelector(`#bf_${t}`).addEventListener("change", (e) => {
                settings.levels[t] = e.target.value;
                saveSettings();
            });
        });

        panel.querySelector("#bf_test_button").addEventListener("click", () => {
            console.log("=== TEST INJECT ===");
            console.log(buildInjectionBlock());
        });

        // Add panel to ST extension area
        stExtensions.registerPanel({
            id: "bigfive-fewshots",
            name: "Big Five Fewshots",
            icon: "✨",
            render: () => panel
        });
    }

    // -------------------------
    // INIT
    // -------------------------

    async function init() {
        loadSavedSettings();
        await loadDataset();
        createUI();
        setupOutgoingHook();

        console.log("[BigFive] Fewshot Injector initialized.");
    }

    init();

})();