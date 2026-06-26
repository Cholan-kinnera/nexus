# Nexus PM - Software Architecture Document (LaTeX)

This directory contains the LaTeX source code and configuration for the **Nexus PM Software Architecture Document (SAD)** (Document ID: `NPM-SAD-001`).

## Directory Structure

```text
docs/architecture/source/
├── main.tex                 # Main document configuration and imports
├── README.md                # This documentation file
├── bibliography/
│   └── references.bib       # BibTeX bibliography file
├── chapters/                # Individual document chapters (sections)
│   ├── 01-cover.tex
│   ├── 02-revision-history.tex
│   └── [03-17]...
├── figures/                 # Empty folder for graphic/diagram assets
├── tables/                  # Empty folder for standalone tables
│   └── .gitkeep
└── appendix/                # Empty folder for appendix sections
```

## How to Compile

### 1. Overleaf
1. Compress the `source` folder into a `.zip` archive.
2. Upload the `.zip` file directly to Overleaf as a new project.
3. Select `main.tex` as the main entry document.
4. Set compiler to **pdfLaTeX** and compile.

### 2. VS Code + LaTeX Workshop
1. Install the **LaTeX Workshop** extension in VS Code.
2. Install a LaTeX distribution on your system (e.g., **TeX Live** or **MiKTeX**).
3. Open the `source` folder in VS Code.
4. Open `main.tex` and trigger compilation (using standard shortcut `Ctrl+Alt+B` or save configuration).

## Asset Guidelines

* **Figures:** Place all graphics, images, and architecture diagrams inside the `figures/` directory. Reference them using `\includegraphics{figures/filename}`.
* **Tables:** Complex tables can be saved as separate `.tex` files in the `tables/` directory and imported using `\input{tables/filename}`.
