# Overlay Submission Rules

This document is part of the [Contributing Guidelines](../CONTRIBUTING.md).

To maintain performance, security, and parsing reliability across the tosu dashboard, all submitted overlays must strictly adhere to the following rules.
Submissions that do not comply with these rules cannot be merged until they are corrected.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

## Table of Contents

- [1. File Structure & Self-Containment](#1-file-structure--self-containment)
- [2. Folder Naming & Metadata Consistency](#2-folder-naming--metadata-consistency)
- [3. WebSocket Connection & Performance (Filters)](#3-websocket-connection--performance-filters)
- [4. Redundancy and Asset Bloat](#4-redundancy-and-asset-bloat)
- [5. Dependencies & Offline Support](#5-dependencies--offline-support)
- [6. Code Quality & Readability](#6-code-quality--readability)
- [7. Generative AI Policy](#7-generative-ai-policy)
- [8. Pull Requests & Git History](#8-pull-requests--git-history)
- [9. Licensing](#9-licensing)

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 1. File Structure & Self-Containment

Your overlay folder must reside inside the [counters/](../counters/) directory, rather than the root of the repository.

Overlays must be self-contained.
Path traversal to files outside of your directory (such as using `../` to access other folders) is prohibited.
Overlays must not store state, configuration, or data in external system directories (such as `APPDATA`) or attempt to write files to system paths.

To ensure repository safety and security, overlays must consist only of standard, pure web assets. Build-dependent frameworks (such as `Svelte`, `Vue`, `React`) or preprocessed stylesheet languages (such as `scss`, `sass`, `less`) are not allowed for future overlays.

Submissions are restricted to the following allowed file extensions and formats (recommended options are highlighted in **bold**):

* **standard for web**: **`.html`**, **`.js`**, **`.css`**
* **images**: **`.png`**, **`.svg`**, **`.webp`**, `.jpg`, `.jpeg`, `.jfif`, `.gif`, `.apng`, `.ico`
* **fonts**: **`.woff2`**, `.woff`, `.ttf`, `.otf`

> [!CAUTION]
> Executable formats, scripts, and archives (including `.exe`, `.dll`, `.msi`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.vbs`, `.zip`, `.tar.gz`, `.rar`, etc.) are strictly prohibited.
> Any Pull Request containing these files will be **automatically closed** to protect repository security.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 2. Folder Naming & Metadata Consistency

Your overlay folder name must exactly follow the format `{Name} by {Author}`.
The dashboard relies on this exact pattern to parse and display overlays.

> [!IMPORTANT]
> The author name in the folder title must be a case-sensitive, case-exact match with the author specified in `metadata.txt`.
> For example, if your folder is named `My PP Counter by Alice`, the author in your metadata file must be `Alice`.

The `metadata.txt` file serves as the data entry point that identifies your overlay in the dashboard.
For rules and instructions on structuring this file, refer to the wiki page on [Overlay metadata](https://github.com/tosuapp/tosu/wiki/Overlay-metadata).

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 3. WebSocket Connection & Performance (Filters)

WebSocket filters are a requirement.
Without filters, `tosu` sends the entire local state payload on every tick.
This generates significant traffic over the local network and unnecessary CPU overhead, even though an overlay only needs a small subset of that data.

You must configure a filter array to only receive the specific fields your overlay uses.
For guidelines and instructions on how to structure filters, see the wiki page on [Applying filters to WebSocket](https://github.com/tosuapp/tosu/wiki/Apply-filters-to-websocket#using-websocketreconnecting-websocket).

> [!TIP]
> While running tosu, you can visit http://127.0.0.1:24050/json/v2 to see what the websocket sends. This helps you understand exactly what data is available for your overlay.

> [!TIP]
> You are not forced to use our default socket wrapper, but we strongly advise against reinventing the WebSocket manager unless you have a highly specialized use case.
> If you do use the official wrapper, [socket.js](../quickstart/js/socket.js) must remain unminified and updated to its latest version.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 4. Redundancy and Asset Bloat

We do not allow redundant assets, duplicate logic, or repository bloat in the name of customizability.

Each overlay must establish only a single WebSocket connection.
Including a second socket connection or opening additional ports is prohibited.

All bundled files must be strictly necessary for the default presentation of the overlay.
You must not include collections of optional fonts, excessive background images, or unused scripts.
For optional fonts, rely on system fonts or instruct users to install them locally on their OS rather than bundling them.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 5. Dependencies & Offline Support

All assets, including scripts, fonts, stylesheets, and images, must be bundled locally inside your folder.

While some overlays require internet access to fetch external data (such as tournament stats, Twitch commands, or stream alerts), core assets must still be stored locally to ensure reliability and faster loading.
You must not assume that because the overlay requires an internet connection, its core assets can be loaded from remote servers.

Third-party dependencies (such as jQuery, Chart.js, or countUp.js) should preferably be minified to save local storage and speed up loading.
However, your own custom overlay logic files must remain unminified so maintainers can review your code during the PR process.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 6. Code Quality & Readability

Your custom code must be readable.
Variables, classes, and function names must be descriptive.

All custom code, variable names, JSDoc definitions, and comments must be in English.

We do not enforce a strict styling guide, but we do not permit code formatted as one-liners or obfuscated scripts.
You must remove all blocks of commented-out code, unused variables, and dead functions before submitting.

Comments are welcome when they explain the context or reasoning behind your code, but heavily commented codebases will be rejected.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 7. Generative AI Policy

We welcome the use of AI tools to assist in your workflow (such as refactoring or generating helper functions), provided that you remain in control of your code.

> [!WARNING]
> Any submission that appears to be mostly AI-generated boilerplate will be rejected.
> We do not condone "vibe-coding" (generating code without understanding it) just for the sake of submitting an overlay.

You must understand how your code works and be prepared to explain specific segments of your submission if asked by maintainers during the PR review.

&nbsp; <!-- <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 8. Pull Requests & Git History

All Pull Requests are squashed upon merging to keep the repository history clean.
Because of this, individual commit messages in your branch history will not be preserved in the master branch.

We require a specific format for Pull Request titles depending on the type of submission:
* New overlays: `new: <full_folder_name>` (for example, `new: My PP Counter by Alice`)
* Updates to existing overlays: `update(<full_folder_name>): <short description>` (for example, `update(My PP Counter by Alice): fix display bug`)

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## 9. Licensing

This repository functions as a community collection, so there is no global license.
Each developer maintains copyright over their own work.
You are encouraged to include a `LICENSE` file within your folder to clarify the usage rights for other developers.
If you do not know what license to choose, you can use [choosealicense.com](https://choosealicense.com/) as a starting point.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

You've reached the bottom of the rules. [Jump to top](#overlay-submission-rules)
