# Tree-sitter ORCA

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [ORCA](https://www.faccts.de/orca/) quantum chemistry input files.

ORCA is a quantum chemistry package for electronic structure calculations.
This grammar parses ORCA input files (`.inp`) including simple command lines, input blocks, geometry specifications as well as complex workflows using compound scripts.
In addition, it provides queries to support syntax highlighting, proper indentation and code folding.

## Demo

<img width="584" height="818" alt="demo" src="https://github.com/user-attachments/assets/23569c11-91f3-40c3-b7f3-c1187692b780" />

## Installation

### Neovim with `nvim-treesitter`

If you are alredy using the [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter), you can configure the parser with it.
Note that you need to also add the filetype `inp` (or any other file extension that you would like) such that the treesitter parser is activated for this non-standard file extension.

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

In order to enable syntax highlighting, queries need to be provided to Treesitter to indicate which part of the code needs to be highlighted with which color.
This is usually conveniently packaged by `nvim-treesitter`.
Currently, I am awaiting the acceptance of my pull request to merge it to the `nvim-treesitter` repository.
Therefore, for the time being, the file https://github.com/kszenes/tree-sitter-orca/blob/master/queries/highlights.scm needs to manually copied into your Neovim configuration:

```bash
mkdir -p ~/.config/nvim/queries/orca
ln -s /path/to/tree-sitter-orca/queries/highlights.scm ~/.config/nvim/queries/orca/highlights.scm
```
