# Tree-sitter ORCA

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [ORCA](https://www.faccts.de/orca/) quantum chemistry input files.

ORCA is a quantum chemistry package for electronic structure calculations.
This grammar parses ORCA input files (`.inp`) including simple command lines, input blocks, geometry specifications as well as complex workflows using compound scripts.
In addition, it provides queries to support syntax highlighting, proper indentation and code folding.

## Demo

<img width="690" height="729" alt="SCR-20250808-ufgv" src="https://github.com/user-attachments/assets/a4dbca4a-0545-4cb6-bdcb-a1a989b401ac" />

## Installation

### PyPI

```bash
pip install tree-sitter-orca
```

### Neovim with nvim-treesitter

#### Enable Parser

Add to your `init.lua`:

```lua
-- Define ORCA '*.inp' extension
vim.filetype.add({
	extension = {
		inp = "inp",
	},
})
-- Enable custom tree-sitter parser
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.orca = {
  install_info = {
    url = "https://github.com/kszenes/tree-sitter-orca",
    files = { "src/parser.c" },
    branch = "main",
  },
  filetype = "inp",
}
```

Install the parser in Neovim using

```
:TSUpdate orca
```

You should now be able to inspect the abstract syntax tree from within Neovim using `:TSInspect`

#### Syntax Highlighting

Create syntax highlighting:

```bash
mkdir -p ~/.config/nvim/queries/orca
ln -s /path/to/tree-sitter-orca/queries/highlights.scm ~/.config/nvim/queries/orca/highlights.scm
```

