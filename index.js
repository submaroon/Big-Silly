// Big Five Few-Shot Injector Extension
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "big-five-injector";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
let fewshotsData = null; // Will hold the loaded JSON

const defaultSettings = {
    selectedTraits: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
    injectionRole: 'system',
    level: 2,
    interval: 5
};

extension_settings[extensionName] = extension_settings[extensionName] || {};

// Load fewshots data
async function loadFewshotsData() {
    try {
        const response = await fetch(`${extensionFolderPath}/big_five_fewshots.json`);
        fewshotsData = await response.json();
    } catch (error) {
        console.error('Failed to load big_five_fewshots.json:', error);
    }
}

// Load settings into UI
function loadSettings() {
    const settings = extension_settings[extensionName];
    
    // Ensure defaults
    Object.assign(settings, defaultSettings);
    
    // Update UI
    $('#openness').prop('checked', settings.selectedTraits.includes('Openness'));
    $('#conscientiousness').prop('checked', settings.selectedTraits.includes('Conscientiousness'));
    $('#extraversion').prop('checked', settings.selectedTraits.includes('Extraversion'));
    $('#agreeableness').prop('checked', settings.selectedTraits.includes('Agreeableness'));
    $('#neuroticism').prop('checked', settings.selectedTraits.includes('Neuroticism'));
    
    $('#injection_role').val(settings.injectionRole);
    $('#level').val(settings.level);
    $('#interval').val(settings.interval);
}

// Save traits
function saveTraits() {
    const selected = [];
    if ($('#openness').is(':checked')) selected.push('Openness');
    if ($('#conscientiousness').is(':checked')) selected.push('Conscientiousness');
    if ($('#extraversion').is(':checked')) selected.push('Extraversion');
    if ($('#agreeableness').is(':checked')) selected.push('Agreeableness');
    if ($('#neuroticism').is(':checked')) selected.push('Neuroticism');
    
    extension_settings[extensionName].selectedTraits = selected;
    saveSettingsDebounced();
}

// Prompt Interceptor
globalThis.bigFiveInterceptor = async function(chat, contextSize, abort, type) {
    if (!fewshotsData || type !== 'normal') return; // Only on normal generation
    
    const settings = extension_settings[extensionName];
    if (settings.selectedTraits.length === 0) return;
    
    // Count user messages
    const userMessages = chat.filter(msg => msg.is_user);
    const userCount = userMessages.length;
    
    if (userCount % settings.interval !== 0) return;
    
    // Pick random question for each trait
    const examples = [];
    for (const trait of settings.selectedTraits) {
        const questionId = Math.floor(Math.random() * 10) + 1; // 1-10
        const question = fewshotsData.find(q => q.question_id === questionId);
        if (question && question.traits[trait]) {
            const response = question.traits[trait][settings.level.toString()];
            if (response) {
                examples.push(response);
            }
        }
    }
    
    if (examples.length === 0) return;
    
    const promptText = `Ниже приведены ПРИМЕРЫ МЫШЛЕНИЯ (Personality Snapshots) этого персонажа.
Используй эти примеры ТОЛЬКО для копирования тона, стиля речи, длины предложений и хода мыслей.
НЕ используй ситуации или предметы из примеров в текущем ролеплее.
${examples.join('\n\n')}`;
    
    const context = getContext();
    const isUser = settings.injectionRole === 'user';
    const name = settings.injectionRole === 'system' ? 'System' :
                 settings.injectionRole === 'user' ? 'User' :
                 context.characters[context.characterId]?.name || 'Assistant';
    
    const injectionMessage = {
        is_user: isUser,
        name: name,
        send_date: Date.now(),
        mes: promptText
    };
    
    // Insert before the last message (assuming last is user)
    chat.splice(-1, 0, injectionMessage);
};

// Main init
jQuery(async () => {
    await loadFewshotsData();
    
    // Load HTML
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $("#extensions_settings").append(settingsHtml);
    
    // Event listeners already set above
    
    loadSettings();
});