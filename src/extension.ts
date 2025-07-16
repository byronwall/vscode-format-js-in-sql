import * as vscode from "vscode";
import * as prettier from "prettier";

export function activate(context: vscode.ExtensionContext) {
  const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider(
    [{ language: "sql" }, { language: "snowflake-sql" }],
    {
      async provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): Promise<vscode.TextEdit[]> {
        const text = document.getText();

        try {
          const formattedText = await formatJavaScriptInSQL(text);

          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
          );

          return [vscode.TextEdit.replace(fullRange, formattedText)];
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error formatting JS in SQL: ${error}`
          );
          return [];
        }
      },
    }
  );

  const diagnosticCollection = vscode.languages.createDiagnosticCollection("js-in-sql");
  
  const diagnosticProvider = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === "sql" || event.document.languageId === "snowflake-sql") {
      updateDiagnostics(event.document, diagnosticCollection);
    }
  });

  const diagnosticProviderOpen = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === "sql" || document.languageId === "snowflake-sql") {
      updateDiagnostics(document, diagnosticCollection);
    }
  });

  context.subscriptions.push(formattingProvider, diagnosticCollection, diagnosticProvider, diagnosticProviderOpen);
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
  const text = document.getText();
  const diagnostics: vscode.Diagnostic[] = [];
  
  const jsBlockRegex = /\$\$([\s\S]*?)\$\$/g;
  let match;
  
  while ((match = jsBlockRegex.exec(text)) !== null) {
    const jsCode = match[1];
    const blockStartIndex = match.index + 2; // Skip the opening $$
    
    // Find lines containing 'throw' within this JS block
    const lines = jsCode.split('\n');
    let currentIndex = blockStartIndex;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const throwMatch = line.match(/\bthrow\b/);
      
      if (throwMatch) {
        const lineStartPos = document.positionAt(currentIndex);
        const throwStartPos = document.positionAt(currentIndex + throwMatch.index!);
        const throwEndPos = document.positionAt(currentIndex + throwMatch.index! + throwMatch[0].length);
        
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(throwStartPos, throwEndPos),
          "Found 'throw' statement in JavaScript block",
          vscode.DiagnosticSeverity.Error
        );
        
        diagnostics.push(diagnostic);
      }
      
      currentIndex += line.length + 1; // +1 for the newline character
    }
  }
  
  collection.set(document.uri, diagnostics);
}

async function formatJavaScriptInSQL(text: string): Promise<string> {
  const jsBlockRegex = /\$\$([\s\S]*?)\$\$/g;

  // Process matches from end to beginning to avoid index shifting issues
  const matches = Array.from(text.matchAll(jsBlockRegex)).reverse();

  let result = text;

  for (const match of matches) {
    try {
      const jsCode = match[1];
      const formatted = await prettier.format(jsCode, {
        parser: "babel",
        singleQuote: true,
        semi: true,
        tabWidth: 2,
        printWidth: 80,
      });

      // Add extra tab indentation to each line
      const indentedCode = formatted
        .split("\n")
        .map((line) => (line.trim() ? `  ${line}` : line))
        .join("\n");

      // Preserve $$ delimiters with newlines
      const replacement = `$$\n${indentedCode}\n$$`;

      // Replace using precise index positions to avoid multiple replacements
      const startIndex = match.index!;
      const endIndex = startIndex + match[0].length;
      result =
        result.substring(0, startIndex) +
        replacement +
        result.substring(endIndex);
    } catch (error) {
      console.error("Error formatting JavaScript code:", error);
    }
  }

  return result;
}

export function deactivate() {}
