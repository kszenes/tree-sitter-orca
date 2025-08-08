(comment) @comment
(integer) @number
(float) @float
(element) @string
(simple_line) @variable.parameter @markup.strong
(input_title) @keyword
(input_key) @property 
(quoted_string) @string 
(geom_line_types) @type
"xyz" @type
"int" @type
"gzmt" @type
"end" @keyword
"*" @keyword
(string) @number 

;; Variables (FIRST - higher priority than general rules) - using @function for prominence
(variable_ref (variable_name) @operator)  ; {r} in geometry blocks
(variable_ref "{" @punctuation.bracket)
(variable_ref "}" @punctuation.bracket)
(variable_def (variable_name) @operator)  ; r in variable definitions
(variable_range (float) @float)
(variable_array (float) @float)

;; Variable definitions in %paras blocks (when parsed as regular kv_pair)
(input_block (input_title (word) @_paras) (input_body (kv_pair (input_key (word) @operator))) (#eq? @_paras "paras"))
;; Variable definitions in pardef subblocks  
(subblock (word) @_pardef (input_body (kv_pair (input_key (word) @operator))) (#eq? @_pardef "pardef"))

";" @punctuation.delimiter

;; Brace blocks
(brace_block "{" @property)
(brace_block "}" @property)
(brace_value (float) @float)
(brace_value (integer) @number)
"," @punctuation.delimiter

;; General word values (LAST - lower priority)
(value_atom (word) @number)  ; Words used as values get same color as other values

;; Internal coordinate highlighting
(int_line connect1: (integer) @operator)
(int_line connect2: (integer) @operator)  
(int_line connect3: (integer) @operator)
(int_line (coord_value (float) @float))
(int_line (coord_value (variable_ref) @operator))

;; Zmatrix coordinate highlighting - alternating pattern like internal coords
(zmat_line2 zmat_atom1: (integer) @operator)
(zmat_line2 (coord_value (float) @float))
(zmat_line2 (coord_value (variable_ref) @operator))

(zmat_line3 zmat_atom1: (integer) @operator)
(zmat_line3 zmat_atom2: (integer) @operator)
(zmat_line3 (coord_value (float) @float))
(zmat_line3 (coord_value (variable_ref) @operator))

(zmat_line4 zmat_atom1: (integer) @operator)
(zmat_line4 zmat_atom2: (integer) @operator)
(zmat_line4 zmat_atom3: (integer) @operator)
(zmat_line4 (coord_value (float) @float))
(zmat_line4 (coord_value (variable_ref) @operator))

;; Subblocks
(subblock name: (word) @character)
(subblock "end" @character)

