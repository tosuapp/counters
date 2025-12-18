# Contributing to the tosu! pp counter repository

Hi there! Thank you for considering contributing to the tosu! pp counter repository. Before you submit your pp counter, please read the following guidelines to ensure a smooth contribution process.

## Table of Contents

- [Getting Started](#getting-started)
  - [Fork & Clone](#fork--clone)
  - [Development & Testing](#development--testing)
  - [Submitting](#submitting)
  - [Review Process](#review-process)
- [Rules](#rules)
  - [File Structure & Naming](#file-structure--naming)
  - [Metadata Requirements](#metadata-requirements)
  - [Websocket Filters](#websocket-filters)
  - [Dependencies & Offline Support](#dependencies--offline-support)
  - [Code Quality & Standards](#code-quality--standards)
  - [Generative AI Policy](#generative-ai-policy)
  - [Git & Commit Standards](#git--commit-standards)
  - [Recommended Resources](#recommended-resources)
- [Licensing](#licensing)
  - [Repository License Structure](#repository-license-structure)
  - [Licensing Your Work](#licensing-your-work)
  - [Maintenance & Modifications](#maintenance--modifications)


&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

---

## Getting Started
If you are new to GitHub or this repository, follow these steps to get your counter submitted. You can use [quickstart](quickstart/) as a template for your own.

#### Fork & Clone
1. Fork this repository to your own GitHub account.
2. Clone your fork locally: `git clone https://github.com/tosuapp/counters.git`.
3. Create a new branch for your pp counter: `git checkout -b feat/my-pp-counter`.

#### Development & Testing
1. In your tosu! static folder, create a new folder following [our naming conventions](#file-structure--naming).
2. Develop your pp counter using HTML, CSS, and JavaScript.
3. Test your counter with tosu! to ensure it works as expected.

#### Submitting
1. Copy your finished counter folder into the `counters/` directory of your local repository.
2. Commit your changes with a clear message.
3. Push to your fork: `git push origin feat/my-cool-counter`.
4. Open a Pull Request against our master branch.

#### Review Process
Once submitted, your Pull Request will undergo a review by our team. \
We usually require approval from two maintainers before a pp counter is merged to ensure quality and compatibility. \
We may ask for small adjustments regarding performance or file structure during this period. 

Once the PR is merged, your counter will shortly appear in the official tosu! dashboard for all users.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

## Rules
To maintain quality and consistency across all pp counters, please adhere to the following rules when submitting a pull request.

### File Structure & Naming
Each pp counter **must be self-contained** within its own directory under the [`counters/`](counters/) folder.

**Folder Format** `{counter_name} by {author_name}`
###### The `{counter_name}` in the folder title must match the name defined in your metadata.txt.

### Metadata Requirements
For your counter to display correctly in the tosu! dashboard, a `metadata.txt` file is required. \
Refer to the [tosu! documentation](https://github.com/tosuapp/tosu/wiki/The-metadata-of-a-pp-counter.) for a detailed guide on structuring this file.

### Websocket Filters
To maintain optimal performance, all counters must use websocket filters. \
This prevents unnecessary data from being sent over the socket and reduces the load on the user's system.

Please refer to our [Wiki Guide on Filters](https://github.com/tosuapp/tosu/wiki/Apply-filters-to-websocket) for a detailed explanation of how to implement them.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

> [!TIP]
> While running tosu!, you can visit http://127.0.0.1:24050/json/v2 to see what the websocket sends. This helps you understand exactly what data is available for your counter.

### Dependencies & Offline Support
Our software is designed to run in offline environments. All assets must be bundled locally.

- Include all libraries, fonts, and images within your folder. **No external CDNs.**
- Third-party libraries must be minified. (such as: `jQuery`, `Chart.js`, `countUp.js`, etc.)
- The tosu! socket should remain unminified and must be up to date at the time of your PR.

### Code Quality & Standards
We value readability and long-term maintainability. \
While we don't enforce a strict style guide, we expect the following:

- Consistent indentation and spacing.
- Self-explanatory variable and function names.
- Consistency in coding style throughout your code.
- English for all documentation and code comments.
- No commented code, unused variables, and dead functions.
- Comments only providing the "why" (context), not the "how" (line-by-line explanation).

### Generative AI Policy
We welcome the use of AI tools **to assist** in your workflow. **However, fully AI-generated submissions will be rejected.** \
We require human oversight and a clear understanding of the code you submit.

### Git & Commit Standards
We do not enforce strict naming conventions, but we do require a level of professionalism to keep the project history readable. \
You can visit [Chris Beams' guide on writing good commit messages](https://chris.beams.io/posts/git-commit/) for more information.

### Recommended Resources
If you are new to development or just want to ensure your contribution meets our standards, we recommend checking out these guides:

- [MDN Web Docs](https://developer.mozilla.org/en-US/)
- [JavaScript Info](https://javascript.info/)
- [HTML Living Standard](https://html.spec.whatwg.org/multipage/)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)

## Licensing

### Repository License Structure
Because this repository serves as a community collection, **there is no single global license.** \
Each pp counter is treated as an individual project and remains the intellectual property of its respective author.

### Licensing Your Work
We encourage you to license your contribution to define how others can use and modify it. \
To do so, simply include a `LICENSE` file within your counter's specific folder.

Recommended Licenses:
- **MIT**: Simple and permissive.
- **GNU GPL v3**: Ensures derivative works stay open-source.
- **Apache 2.0**: Includes explicit patent rights.
- **Creative Commons** (e.g., CC BY-SA): Good for design-heavy counters.

If you are unsure which to pick, visit [choosealicense.com](https://choosealicense.com/) for guidance.

### Maintenance & Modifications

> [!IMPORTANT]
> By submitting your counter, you allow the tosu! team to apply urgent modifications for performance, security, or compatibility without prior notice. For any other non-essential changes or community improvements, we will attempt to contact you for approval before merging. Your original authorship will always be preserved in the metadata and version history.

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

&nbsp; <!-- This is a non-breaking space ASCII character. Used for additional vertical spacing. -->

You've reached to bottom of the contributing guide. [Jump to top](#contributing-to-the-tosu-pp-counter-repository)
