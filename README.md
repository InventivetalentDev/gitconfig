# gitconfig

##### Install
```
npm install --save @inventivetalent/gitconfig
```

##### Public Repo Example
```js
import GitConfig from "@inventivetalent/gitconfig"

// Set source for all config files
GitConfig.source = "https://raw.githubusercontent.com/me/myrepo/master/";

// Load config.json from the source
const myConfig = await GitConfig.get("config.json");

// Invalidate changes
await myConfig.invalidate();
```

##### Private Repo Example
```js
import GitConfig from "@inventivetalent/gitconfig"

// GitHub authorization + raw
GitConfig.axiosInstance.defaults.headers["Authorization"] = "token MyGithubToken";
GitConfig.axiosInstance.defaults.headers["Accept"] = "Application/vnd.github.v3.raw";

// Set source for all config files
GitConfig.source = "https://api.github.com/repos/me/myrepo/";

// Load config.json from the source
const myConfig = await GitConfig.get("config.json");

// Invalidate changes
await myConfig.invalidate();
```
