# Developer Guide: Getting Started

This document is part of the [Contributing Guidelines](../CONTRIBUTING.md).

This guide walks you through setting up your environment, developing an overlay, testing it locally, and submitting a pull request.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

## Table of Contents

- [Step 1: Fork & Clone](#step-1-fork--clone)
- [Step 2: Set Up & Development](#step-2-set-up--development)
- [Step 3: Local Testing](#step-3-local-testing)
- [Step 4: Submission](#step-4-submission)
- [Submission Checklist](#submission-checklist)

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## Step 1: Fork & Clone

1. Fork the [counters repository](https://github.com/tosuapp/counters) to your GitHub account.
2. Clone your fork locally to your development machine:
   ```bash
   git clone https://github.com/tosuapp/counters.git
   ```
3. Create a new branch for your overlay:
   ```bash
   git checkout -b feat/my-fancy-overlay
   ```

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## Step 2: Set Up & Development

We recommend using the [quickstart](../quickstart/) directory as a template for your project.

1. Locate your local `tosu` installation directory and navigate to its `./static` folder.
2. Create a folder following our naming convention: `Your Overlay Name by Your Name` (as defined in [RULES.md](RULES.md#2-folder-naming--metadata-consistency)).
3. Develop your overlay. If you choose to use a bundler or framework (such as React, Vue, Svelte, or Next.js), you must build and compile your project into static HTML, CSS, and JS.
4. Integrate the WebSocket using the wrapper script [socket.js](../quickstart/js/socket.js) and make sure to apply [WebSocket filters](RULES.md#3-websocket-connection--performance-filters).

> [!TIP]
> While running tosu, you can visit http://127.0.0.1:24050/json/v2 to see what the websocket sends. This helps you understand exactly what data is available for your overlay.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## Step 3: Local Testing

1. Launch the `tosu` desktop application and check that your local server is running (usually at `http://127.0.0.1:24050`).
2. Test your overlay in various game states (menu navigation, active gameplay, and results screen).
3. Ensure no JavaScript or CSS errors appear in the browser console.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## Step 4: Submission

Once your overlay is working perfectly and complies with all rules:

1. Copy your final overlay folder from your local `tosu` static directory into the [counters/](../counters/) folder of your cloned repository.
2. Commit your changes with a clear commit description:
   ```bash
   git add .
   git commit -m "feat: add Alice's Cool Counter"
   ```
3. Push the branch to your fork:
   ```bash
   git push origin feat/my-fancy-overlay
   ```
4. Open a Pull Request on GitHub against the `master` branch of the `tosuapp/counters` repository.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## Submission Checklist

Before opening your Pull Request, ensure you can check off all of the following workflow requirements:

- [ ] The overlay directory is copied inside the `counters/` directory (rather than the repository root).
- [ ] Your Pull Request description includes a screenshot or a GIF showing the overlay in action.
- [ ] Your Pull Request title follows the required format (e.g. `new: <full_folder_name>` or `update(<full_folder_name>): <short description>`).

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

You've reached the bottom of the guide. [Jump to top](#developer-guide-getting-started)
