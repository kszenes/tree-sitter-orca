package tree_sitter_orca_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_orca "github.com/tree-sitter/tree-sitter-orca/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_orca.Language())
	if language == nil {
		t.Errorf("Error loading Orca grammar")
	}
}
