/**
 * @file Parser for input file for the Orca quantum chemistry package
 * @author Kalman Szenes <szenes.kalman@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "orca",

  // Handle conflicts between similar constructs
  conflicts: $ => [
    [$.variable_name, $.input_key],
    [$.variable_name, $.array]
  ],


  extras: $ => [
    /\s/,    // Whitespace
    $.comment
  ],

  rules: {
    source_file: $ => repeat(
      choice($.simple_line, $._input, $._geom)
    ),

    simple_line: $ => seq(
      '!', repeat($.arg), "\n"
    ),

    _input: $ => choice(
      $.input_block, $.input_line
    ),

    input_line: $ => seq(
      $.input_title, choice($.quoted_string, $.float), "\n"
    ),

    input_block: $ => seq(
      $.input_title,
      optional($.input_body),
      "end"
    ),

    // An input body is a sequence of key-value pairs, subblocks, variable definitions, and raw content
    input_body: $ => repeat1(
      choice($.kv_pair, $.subblock, $.variable_def, $.raw_content)
    ),

    // A subblock starts with a word on its own line, contains its own body, and ends with 'end'
    subblock: $ => prec.dynamic(2, seq(
      field('name', $.word),
      "\n",
      optional(choice(
        repeat1($.xyz_line),  // Allow xyz coordinate lines in subblocks
        repeat1($.int_line),  // Allow internal coordinate lines in subblocks
        repeat1(choice($.zmat_line1, $.zmat_line2, $.zmat_line3, $.zmat_line4)),  // Allow zmatrix coordinate lines in subblocks
        $.input_body    // Regular input body
      )),
      "end"
    )),

    // Key-value pair. Support optional '=' and list-like values (e.g., "1,3")
    kv_pair: $ => prec(-1, seq(
      $.input_key,
      optional("="),
      $.value,
      optional(";")  // Optional semicolon for variable definitions
    )),

    // Variable definition (for pardef/paras blocks)
    variable_def: $ => choice(
      // Array definition: r [1.0 2.0] (no = sign, optional semicolon)
      seq(
        $.variable_name,
        $.variable_array,
        optional(";")
      ),
      // Other definitions: r = 10.2; or r = 1, 2, 10; (optional semicolon)
      seq(
        $.variable_name,
        "=",
        choice($.float, $.integer, $.variable_range),
        optional(";")
      )
    ),

    variable_name: $ => $.word,

    variable_range: $ => seq(
      $.float,
      ",",
      $.float,
      ",",
      $.float
    ),

    variable_array: $ => seq(
      "[",
      $.float,
      repeat($.float),
      "]"
    ),

    // Value can be a comma-separated list of atoms
    value: $ => seq(
      $.value_atom,
      repeat(seq(",", $.value_atom))
    ),

    // Atomic values supported in ORCA inputs (order matters for precedence)
    value_atom: $ => choice(
      $.float,
      $.integer,
      $.quoted_string,
      $.array,
      $.brace_block,
      $.string,
      $.word  // Allow simple words as values too
    ),

    // Legacy: input_args kept for back-compat if referenced elsewhere
    input_args: $ => repeat1(
      seq($.input_key, choice($.float, $.string))
    ),

    input_key: $ => choice(
      $.word, $.array
    ),

    input_title: $ => seq(
      "%", $.word
    ),

    _geom: $ => choice(
      $.geom_block,
      $.geom_line
    ),

    geom_line: $ => seq(
      "*", $.geom_line_types, $.integer, $.integer, $.file, "\n"
    ),

    geom_block: $ => choice(
      seq(
        "*", "xyz", $.integer, $.integer, "\n",
        repeat1($.xyz_line),
        "*", "\n"
      ),
      seq(
        "*", "int", $.integer, $.integer, "\n",
        repeat1($.int_line),
        "*", "\n"
      ),
      seq(
        "*", "gzmt", $.integer, $.integer, "\n",
        repeat1(choice($.zmat_line1, $.zmat_line2, $.zmat_line3, $.zmat_line4)),
        "*", "\n"
      )
    ),

    geom_line_types: $ => choice("xyzfile", "gzmtfile"),

    geom_block_types: $ => choice("xyz", "gzmt", "int"),

    int_line: $ => seq(
      $.element, 
      field('connect1', $.integer), 
      field('connect2', $.integer), 
      field('connect3', $.integer), 
      $.coord_value, 
      $.coord_value, 
      $.coord_value, 
      "\n"
    ),

    // Zmatrix (GZMT format) lines with progressive structure
    // Alternating pattern: index, value, index, value, index, value...
    zmat_line1: $ => seq(
      $.element, "\n"
    ),

    zmat_line2: $ => seq(
      $.element, 
      field('zmat_atom1', $.integer), 
      $.coord_value, 
      "\n"
    ),

    zmat_line3: $ => seq(
      $.element, 
      field('zmat_atom1', $.integer), 
      $.coord_value,
      field('zmat_atom2', $.integer), 
      $.coord_value, 
      "\n"
    ),

    zmat_line4: $ => seq(
      $.element, 
      field('zmat_atom1', $.integer), 
      $.coord_value,
      field('zmat_atom2', $.integer), 
      $.coord_value,
      field('zmat_atom3', $.integer), 
      $.coord_value, 
      "\n"
    ),

    xyz_line: $ => seq(
      $.element, $.coord_value, $.coord_value, $.coord_value, "\n"
    ),

    // Coordinate values can be floats or variable references
    coord_value: $ => choice(
      $.float,
      $.variable_ref
    ),

    // Variable reference like {r}
    variable_ref: $ => seq(
      "{",
      $.variable_name,
      "}"
    ),

    array: $ => seq(
      $.word, "[", choice($.string, $.integer), "]"
    ),

    // For constructs like rotate { ... } or other brace-delimited content
    brace_block: $ => seq(
      "{",
      optional($.brace_content),
      "}"
    ),

    // Content inside braces - numbers separated by optional commas
    brace_content: $ => seq(
      $.brace_value,
      repeat(seq(optional(","), $.brace_value))
    ),

    // Values that can appear inside braces
    brace_value: $ => choice(
      $.float,
      $.integer
    ),

    // Raw content for subblocks that contain only brace blocks
    raw_content: $ => $.brace_block,

    comment: $ => /#.*/,
    element: $ => /[A-Za-z]{1,2}/,
    word: $ => /[A-Za-z][A-Za-z0-9_]*/,
    string: $ => /[A-Za-z]+[A-Za-z0-9\_\-"]*/,
    quoted_string: $ => /"[A-Za-z0-9\_\-\.]*"/,
    float: $ => /(-)?[0-9]+(\.[0-9]+)?(e(-)?[0-9]+)?/,
    integer: $ => /[0-9\-]+/,
    file: $ => /[A-Za-z0-9\.]+/,

    arg: $ => /[A-Za-z0-9\-\(\)]+/

  }
});
