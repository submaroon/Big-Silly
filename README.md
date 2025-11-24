# Big Five Few-Shot Injector

This SillyTavern extension injects few-shot personality examples based on the Big Five (OCEAN) traits into the chat prompt. It helps guide the AI's responses by providing random snapshots of character thinking and behavior at specified intervals, without using the example scenarios directly.

## Features

- **Trait Selection**: Choose which Big Five traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) to include via checkboxes.
- **Injection Role**: Select the message role for injection (System, User, or Assistant).
- **Level Control**: Set the intensity level (0-4) for each trait's example, where 0 is low and 4 is high.
- **Interval Setting**: Inject examples every N user messages (e.g., every 5th message).
- **Randomization**: For each injection, randomly selects one example per selected trait from 10 predefined scenarios.
- **Prompt Formatting**: Builds a standardized prompt reminding the AI to copy only tone, style, and thought patterns, not scenarios.

The extension uses a JSON file with 10 scenarios, each providing 5 levels of responses per trait.

## Installation

1. Download or clone this repository.
2. Place the `big-five-injector` folder in `SillyTavern/public/scripts/extensions/third-party/`.
3. Restart SillyTavern or reload the extensions.
4. The extension will appear in the Extensions tab under "Manage Extensions". Enable it if needed.

Alternatively, use SillyTavern's built-in extension installer if available.

## Usage

1. **Enable the Extension**: Go to the Extensions panel in SillyTavern and ensure "Big Five Few-Shot Injector" is enabled.
2. **Configure Settings**:
   - **Select Traits**: Check the boxes for desired traits (all enabled by default).
   - **Injection Role**: Choose "System" (default), "User", or "Assistant" for the injected message's role.
   - **Level**: Set a number from 0 (low trait expression) to 4 (high). Applies to all selected traits.
   - **Interval**: Number of user messages between injections (default: 5).
3. **Start Chatting**: The extension automatically injects the prompt before the AI's response on every Nth user message.
   - Injection happens via the prompt interceptor, modifying the chat history temporarily for generation.
   - The injected message is not permanently added to the chat log.

Example: With interval 5 and traits Openness/Neuroticism at level 2, every 5th user message will prepend a system message with 2 random examples (one per trait) in the specified format.

## Prerequisites

- SillyTavern version 1.10.0 or later.
- No external dependencies; uses built-in SillyTavern APIs.

## How It Works

- **Data Source**: `big_five_fewshots.json` contains 10 scenarios with trait-specific responses at levels 0-4.
- **Trigger**: On normal text generation (not regenerate/swipe), checks user message count modulo interval.
- **Selection**: For each selected trait, picks a random scenario and extracts the response at the set level.
- **Prompt Build**: Formats as: "Ниже приведены ПРИМЕРЫ МЫШЛЕНИЯ... {examples}".
- **Insertion**: Adds as a message in the chosen role before the last (user) message in the chat array for that generation.

The AI is instructed to use examples only for style/tone, ensuring roleplay integrity.

## Support and Contributions

- For issues or questions: Open a GitHub issue or contact the author.
- Contributions: Fork the repo, make changes, and submit a pull request. Ensure compatibility with latest SillyTavern.

## License

AGPLv3 - See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.html for details.

---

*Author: Roo* | *Version: 1.0.0*