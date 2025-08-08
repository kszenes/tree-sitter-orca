# Tree-sitter ORCA

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [ORCA](https://www.faccts.de/orca/) quantum chemistry input files.

ORCA is a quantum chemistry package for electronic structure calculations. This grammar parses ORCA input files (`.inp`) including simple command lines, input blocks, geometry specifications, and variable definitions.

## Installation

### PyPI
```bash
pip install tree-sitter-orca
```

### Neovim with nvim-treesitter

Add to your `init.lua`:

```lua
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

Create syntax highlighting:
```bash
mkdir -p ~/.config/nvim/queries/orca
ln -s /path/to/tree-sitter-orca/queries/highlights.scm ~/.config/nvim/queries/orca/highlights.scm
```

## Distribution

This grammar is distributed via PyPI for Python applications and can be integrated into text editors through nvim-treesitter or similar extensions.

> [!important]
> After grammar changes:
> - Regenerate: `tree-sitter generate`
> - Update in editors: `TSUpdate orca` (nvim)
