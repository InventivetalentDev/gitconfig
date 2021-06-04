# gitconfig

```
npm install --save @inventivetalent/gitconfig
```

```js
import GitConfig from "@inventivetalent/gitconfig"

// Set source for all config files
GitConfig.source = "https://raw.githubusercontent.com/me/myrepo/master/";

// Load config.json from the source
const myConfig = await GitConfig.get("config.json");

// Invalidate changes
await myConfig.invalidate();
```
