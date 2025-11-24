# Big Five Personality Injector Extension for SillyTavern

This extension injects personality traits based on the Big Five personality model into the chat context.

## Installation

1. Place the `big-five-extension` folder into `scripts/extensions/third-party/` in your SillyTavern installation.
2. Restart SillyTavern or reload the extensions.

## Usage

1. Go to the Extensions tab in SillyTavern.
2. Find "Big Five Personality Injector" in the extensions list and enable it.
3. Configure the personality traits and injection settings:

   - **Personality Traits**: Select levels for Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism (0-4, or "Not Selected").
   - **Injection Source**: Choose whether the personality examples are injected as System, User, or Assistant messages.
   - **Injection Depth**: Set the number of personality responses to inject (1-10).
   - **Message Interval**: Set how often to inject (every N messages).

4. The extension will automatically inject personality examples into the chat context according to your settings.

## How It Works

The extension uses a few-shot learning approach by injecting examples of thinking patterns and speech styles based on the selected personality traits. It randomly selects one response per trait from the available scenarios and injects them into the chat context to influence the AI's behavior.

The injected prompt format is:

```
Ниже приведены ПРИМЕРЫ МЫШЛЕНИЯ (Personality Snapshots) этого персонажа.
Используй эти примеры ТОЛЬКО для копирования тона, стиля речи, длины предложений и хода мыслей.
НЕ используй ситуации или предметы из примеров в текущем ролеплее.

[Random responses from selected personality traits]
```

## Troubleshooting

- If the extension doesn't appear, check the browser console for errors.
- Make sure the extension folder is named exactly `big-five-extension` and placed in `scripts/extensions/third-party/`.
- The extension requires SillyTavern version 1.10.0 or higher.

## License

This extension is provided as-is under the MIT License.