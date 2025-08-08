## Installation

Put into `~/.config/nvim/init.lua`:

```lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.zimbu = {
  install_info = {
    url = "~/code/qc_lsp/tree-sitter-orca", -- local path or git repo
    files = { "src/parser.c" }, -- note that some parsers also require src/scanner.c or src/scanner.cc
    -- optional entries:
    branch = "main", -- default branch in case of git repo if different from master
    generate_requires_npm = false, -- if stand-alone parser without npm dependencies
    requires_generate_from_grammar = false, -- if folder contains pre-generated src/parser.c
  },
  filetype = "inp", -- if filetype does not match the parser name
}
```

This will enable the treesitter parsing.
In order to add the syntax highlighting one needs to link it manually:

```sh
ln ~/code/qc_lsp/tree-sitter-orca/queries/highlights.scm ~/.config/nvim/queries/orca
```

> [!important]
> Whenever you make changes to the grammar, you need to 
> - regenerate: `tree-sitter generate`
> - update in nvim: `TSUpdate orca`
