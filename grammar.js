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
      choice($.simple_line, $._input, $._geom, $.compound_script, $.compound_variable_declaration, $.compound_step_block, $.compound_assignment, $.compound_array_assignment, $.compound_for_loop, $.compound_if_block, $.compound_function_call, $.compound_end)
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

    // Compound script variable declarations: Variable name = value; or Variable name[size]; or Variable name1,name2,name3;
    compound_variable_declaration: $ => choice(
      seq(
        /[Vv][Aa][Rr][Ii][Aa][Bb][Ll][Ee]/,
        $.variable_name,
        "=",
        $.compound_value,
        ";"
      ),
      seq(
        /[Vv][Aa][Rr][Ii][Aa][Bb][Ll][Ee]/,
        $.variable_name,
        "[",
        choice($.integer, $.float),
        "]",
        ";"
      ),
      seq(
        /[Vv][Aa][Rr][Ii][Aa][Bb][Ll][Ee]/,
        $.variable_name,
        ";"
      ),
      // Multiple comma-separated variable declarations
      seq(
        /[Vv][Aa][Rr][Ii][Aa][Bb][Ll][Ee]/,
        $.variable_name,
        repeat1(seq(",", $.variable_name)),
        ";"
      )
    ),

    // Values that can be assigned to compound variables
    compound_value: $ => choice(
      $.quoted_string,    // "initial.xyz"
      $.float,            // 1.5, -10.0
      $.integer,          // 0, 25
      $.word,             // method names like BP86
      $.compound_boolean, // true/false
      $.compound_array    // [1, 2, 3] 
    ),

    compound_boolean: $ => choice(
      /[Tt][Rr][Uu][Ee]/, 
      /[Ff][Aa][Ll][Ss][Ee]/
    ),

    compound_array: $ => seq(
      "[",
      optional(seq(
        $.compound_value,
        repeat(seq(",", $.compound_value))
      )),
      "]"
    ),

    // Compound script step blocks: NewStep ... StepEnd or New_Step ... Step_End
    compound_step_block: $ => choice(
      seq(
        /[Nn][Ee][Ww][Ss][Tt][Ee][Pp]/,
        optional($.compound_step_body),
        /[Ss][Tt][Ee][Pp][Ee][Nn][Dd]/
      ),
      seq(
        /[Nn][Ee][Ww]_[Ss][Tt][Ee][Pp]/, 
        optional($.compound_step_body),
        /[Ss][Tt][Ee][Pp]_[Ee][Nn][Dd]/
      )
    ),

    // Body of a compound step - can contain regular ORCA input elements
    compound_step_body: $ => repeat1(
      choice(
        $.simple_line,
        $._input,
        $._geom
      )
    ),

    // Simple assignment statements: variable = value;
    compound_assignment: $ => seq(
      $.variable_name,
      "=",
      $.compound_assignment_value,
      ";"
    ),

    // Values that can be assigned - proper arithmetic expressions
    compound_assignment_value: $ => $.compound_expression,

    // Expression handling with proper precedence
    compound_expression: $ => choice(
      $.compound_additive_expr
    ),

    compound_additive_expr: $ => prec.left(1, choice(
      $.compound_multiplicative_expr,
      seq($.compound_additive_expr, choice("+", "-"), $.compound_multiplicative_expr)
    )),

    compound_multiplicative_expr: $ => prec.left(2, choice(
      $.compound_primary_expr,
      seq($.compound_multiplicative_expr, choice("*", "/"), $.compound_primary_expr)
    )),

    compound_primary_expr: $ => choice(
      $.float,
      $.integer,
      $.quoted_string,
      $.compound_array_access,
      $.variable_name,
      seq("(", $.compound_expression, ")")
    ),

    // Array access like energies[iang] or SCF_ENERGY[jobStep]
    compound_array_access: $ => seq(
      $.variable_name,
      "[",
      $.compound_expression,
      "]"
    ),

    // For loop: for variable from start to end do ... endfor
    compound_for_loop: $ => seq(
      /[Ff][Oo][Rr]/,
      $.variable_name,
      /[Ff][Rr][Oo][Mm]/,
      $.compound_expression,
      /[Tt][Oo]/,
      $.compound_expression,
      /[Dd][Oo]/,
      repeat($.compound_statement),
      /[Ee][Nn][Dd][Ff][Oo][Rr]/
    ),

    // If block: if (condition) then ... else ... endif
    compound_if_block: $ => seq(
      /[Ii][Ff]/,
      "(", $.compound_condition, ")",
      /[Tt][Hh][Ee][Nn]/,
      repeat($.compound_statement),
      optional(seq(
        /[Ee][Ll][Ss][Ee]/,
        repeat($.compound_statement)
      )),
      /[Ee][Nn][Dd][Ii][Ff]/
    ),

    // Statements that can appear inside for loops and if blocks
    compound_statement: $ => choice(
      $.compound_assignment,
      $.compound_array_assignment,
      $.compound_variable_declaration,
      $.compound_step_block,
      $.compound_if_block,
      $.compound_for_loop,
      $.simple_line,
      $._input,
      $._geom,
      $.compound_function_call
    ),

    // Special array assignment like "Read energies[iang] = SCF_ENERGY[jobStep];"
    compound_array_assignment: $ => seq(
      optional(/[Rr][Ee][Aa][Dd]/),
      $.compound_array_access,
      "=",
      $.compound_expression,
      ";"
    ),

    // Conditions for if statements (simplified)
    compound_condition: $ => choice(
      $.compound_comparison,
      prec.left(1, seq($.compound_condition, /[Aa][Nn][Dd]/, $.compound_condition)),
      prec.left(0, seq($.compound_condition, /[Oo][Rr]/, $.compound_condition))
    ),

    compound_comparison: $ => seq(
      $.compound_expression,
      choice("<", ">", "=", "<=", ">=", "==", "!="),
      $.compound_expression
    ),

    // Function calls like Read_Geom(), print(), etc.
    compound_function_call: $ => seq(
      $.variable_name,
      "(",
      optional($.compound_argument_list),
      ")",
      optional(";")
    ),

    compound_argument_list: $ => seq(
      $.compound_expression,
      repeat(seq(",", $.compound_expression))
    ),

    // Compound script wrapper: %compound ... end/endrun
    compound_script: $ => seq(
      seq("%", /[Cc][Oo][Mm][Pp][Oo][Uu][Nn][Dd]/),
      repeat(choice(
        $.compound_variable_declaration,
        $.compound_step_block,
        $.compound_assignment,
        $.compound_array_assignment,
        $.compound_for_loop,
        $.compound_if_block,
        $.compound_function_call,
        $.simple_line,
        $._input,
        $._geom
      )),
      choice(/[Ee][Nn][Dd]/, /[Ee][Nn][Dd][Rr][Uu][Nn]/)
    ),

    // Compound variable reference like &{variable_name}
    compound_variable_reference: $ => seq(
      "&{",
      $.variable_name,
      "}"
    ),

    // Standalone compound end statement
    compound_end: $ => choice(/[Ee][Nn][Dd]/, /[Ee][Nn][Dd][Rr][Uu][Nn]/),

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
      $.compound_variable_reference,
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
      "*", $.geom_line_types, 
      choice($.integer, $.compound_variable_reference), 
      choice($.integer, $.compound_variable_reference), 
      choice($.file, $.compound_variable_reference), 
      "\n"
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
      $.variable_ref,
      $.compound_variable_reference
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

    // Content inside braces - can be numeric values or constraints
    brace_content: $ => choice(
      // Regular comma-separated numeric values
      seq(
        $.brace_value,
        repeat(seq(optional(","), $.brace_value))
      ),
      // Single constraint like "A 1 0 2 &{angle} C"
      $.constraint_content
    ),

    // Values that can appear inside braces (numeric only)
    brace_value: $ => choice(
      $.float,
      $.integer
    ),

    // Constraint content like "A 1 0 2 &{angle} C"
    constraint_content: $ => seq(
      choice("A", "B", "D", "T"),  // Common constraint types
      repeat1(choice(
        $.integer,
        $.float,
        $.compound_variable_reference
      )),
      optional(choice("C", "S", "F"))  // Constraint flags
    ),

    // Raw content for subblocks that contain only brace blocks
    raw_content: $ => $.brace_block,

    comment: $ => /#.*/,
    element: $ => /[A-Za-z]{1,2}/,
    word: $ => /[A-Za-z][A-Za-z0-9_]*/,
    string: $ => /[A-Za-z]+[A-Za-z0-9\_\-"]*/,
    quoted_string: $ => /"[^"]*"/,
    float: $ => /(-)?[0-9]+(\.[0-9]+)?(e(-)?[0-9]+)?/,
    integer: $ => /[0-9\-]+/,
    file: $ => /[A-Za-z0-9\.]+/,

    arg: $ => choice(
      /[A-Za-z0-9\-\(\)]+/,
      $.compound_variable_reference
    )

  }
});
