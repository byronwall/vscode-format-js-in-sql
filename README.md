# Format JS in SQL

A VS Code extension that formats JavaScript code inside `$$` markers within SQL files.

## Features

- Detects JavaScript code blocks wrapped in `$$` markers
- Formats the JavaScript code using Prettier with proper indentation
- Works with `.sql` files and files with `snowflake-sql` language ID
- Preserves `$$` delimiters with newlines
- Adds extra tab indentation for better readability
- Integrates with VS Code's built-in formatting system

## Usage

1. Open a SQL file containing JavaScript code in `$$` markers
2. Use VS Code's format document command (`Shift+Alt+F` on Windows/Linux, `Shift+Option+F` on Mac)
3. Or right-click and select "Format Document"
4. Or use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "Format Document"

## Example

Before formatting:
```sql
SELECT 
$$
const x=1;const y=2;
if(x>y){console.log("x is greater");}
$$
```

After formatting:
```sql
SELECT 
$$
	const x = 1;
	const y = 2;
	if (x > y) {
	  console.log('x is greater');
	}
$$
```

## Development

1. Install dependencies: `npm install`
2. Compile: `npm run compile`
3. Press F5 to run the extension in a new Extension Development Host window