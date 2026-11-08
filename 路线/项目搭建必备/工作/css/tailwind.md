## 用 taiwindcss 配置，在 vscode 中
1. `Ctrl+Shift+P` → `Change Language Mode` → 手动选 **Tailwind CSS**（这个是扩展自带的语法模式，选中之后 `@theme inline` 就不会标红）
2. 加到 workspace `.vscode/settings.json`：
	1. ```json
		{
		  "files.associations": {
		    "*.css": "tailwindcss"
		  },
		  "css.lint.unknownAtRules": "ignore"
		}
	   ```