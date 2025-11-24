// Big Five Personality Injector Extension for SillyTavern
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// Extension configuration
const extensionName = "big-five-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    enabled: true,
    openness: -1,
    conscientiousness: -1,
    extraversion: -1,
    agreeableness: -1,
    neuroticism: -1,
    injection_source: "system",
    injection_depth: 5,
    message_interval: 1,
    message_count: 0
};

// Load Big Five data from the JSON file
let bigFiveData = null;

async function loadBigFiveData() {
    try {
        const response = await fetch(`${extensionFolderPath}/big_five_fewshots.json`);
        bigFiveData = await response.json();
        console.log("Big Five data loaded successfully");
    } catch (error) {
        console.error("Failed to load Big Five data:", error);
    }
}

// Load extension settings
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // Update UI with current settings
    $("#big_five_enabled").prop("checked", extension_settings[extensionName].enabled).trigger("input");
    $("#big_five_openness").val(extension_settings[extensionName].openness).trigger("change");
    $("#big_five_conscientiousness").val(extension_settings[extensionName].conscientiousness).trigger("change");
    $("#big_five_extraversion").val(extension_settings[extensionName].extraversion).trigger("change");
    $("#big_five_agreeableness").val(extension_settings[extensionName].agreeableness).trigger("change");
    $("#big_five_neuroticism").val(extension_settings[extensionName].neuroticism).trigger("change");
    $("#big_five_injection_source").val(extension_settings[extensionName].injection_source).trigger("change");
    $("#big_five_injection_depth").val(extension_settings[extensionName].injection_depth).trigger("input");
    $("#big_five_message_interval").val(extension_settings[extensionName].message_interval).trigger("input");
}

// Get random response for a specific trait and level
function getRandomResponse(trait, level) {
    if (!bigFiveData || level < 0 || level > 4) return null;
    
    // Get all questions for the trait
    const responses = [];
    bigFiveData.forEach(question => {
        if (question.traits[trait] && question.traits[trait][level]) {
            responses.push(question.traits[trait][level]);
        }
    });
    
    if (responses.length === 0) return null;
    
    // Return random response
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

// Generate personality injection prompt
function generatePersonalityPrompt() {
    const traits = [
        { name: "Openness", level: extensionSettings.openness },
        { name: "Conscientiousness", level: extensionSettings.conscientiousness },
        { name: "Extraversion", level: extensionSettings.extraversion },
        { name: "Agreeableness", level: extensionSettings.agreeableness },
        { name: "Neuroticism", level: extensionSettings.neuroticism }
    ];
    
    const selectedResponses = [];
    
    traits.forEach(trait => {
        if (trait.level >= 0 && trait.level <= 4) {
            const response = getRandomResponse(trait.name, trait.level);
            if (response) {
                selectedResponses.push(response);
            }
        }
    });
    
    if (selectedResponses.length === 0) return null;
    
    const prompt = `Ниже приведены ПРИМЕРЫ МЫШЛЕНИЯ (Personality Snapshots) этого персонажа.
Используй эти примеры ТОЛЬКО для копирования тона, стиля речи, длины предложений и хода мыслей.
НЕ используй ситуации или предметы из примеров в текущем ролеплее.

${selectedResponses.join('\n\n')}`;
    
    return prompt;
}

// Prompt interceptor function
globalThis.bigFiveInterceptor = async function(chat, contextSize, abort, type) {
    if (!extensionSettings.enabled) return;
    
    // Check if we should inject based on message interval
    extensionSettings.message_count = (extensionSettings.message_count || 0) + 1;
    if (extensionSettings.message_count < extensionSettings.message_interval) {
        return;
    }
    extensionSettings.message_count = 0;
    
    const personalityPrompt = generatePersonalityPrompt();
    if (!personalityPrompt) return;
    
    // Create injection message based on selected source
    const injectionMessage = {
        is_user: extensionSettings.injection_source === "user",
        name: extensionSettings.injection_source === "user" ? "You" : 
              extensionSettings.injection_source === "assistant" ? "Assistant" : "System",
        send_date: Date.now(),
        mes: personalityPrompt
    };
    
    // Insert the injection message
    chat.unshift(injectionMessage);
    
    console.log("Big Five personality injection applied");
}

// Event handlers for settings changes
function onEnabledChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
}

function onPersonalityChange(event) {
    const trait = $(event.target).attr('id').replace('big_five_', '');
    const value = parseInt($(event.target).val());
    extension_settings[extensionName][trait] = value;
    saveSettingsDebounced();
}

function onInjectionSourceChange(event) {
    const value = $(event.target).val();
    extension_settings[extensionName].injection_source = value;
    saveSettingsDebounced();
}

function onInjectionDepthChange(event) {
    const value = parseInt($(event.target).val());
    extension_settings[extensionName].injection_depth = value;
    saveSettingsDebounced();
}

function onMessageIntervalChange(event) {
    const value = parseInt($(event.target).val());
    extension_settings[extensionName].message_interval = value;
    saveSettingsDebounced();
}

// Initialize extension
jQuery(async () => {
    // Load settings HTML
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $("#extensions_settings").append(settingsHtml);
    
    // Load Big Five data
    await loadBigFiveData();
    
    // Load extension settings
    await loadSettings();
    
    // Register event listeners
    $("#big_five_enabled").on("input", onEnabledChange);
    $("#big_five_openness, #big_five_conscientiousness, #big_five_extraversion, #big_five_agreeableness, #big_five_neuroticism").on("change", onPersonalityChange);
    $("#big_five_injection_source").on("change", onInjectionSourceChange);
    $("#big_five_injection_depth").on("input", onInjectionDepthChange);
    $("#big_five_message_interval").on("input", onMessageIntervalChange);
    
    console.log("Big Five Personality Injector extension loaded");
});