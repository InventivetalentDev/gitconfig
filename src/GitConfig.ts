import {writeFile, readFile} from "fs/promises";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import {merge} from "ts-deepmerge";
import {join} from "path";

export class GitConfig<C> {

    /**
     * Log all errors instead of suppressing them
     */
    static debug: boolean = false;

    /**
     * Axios instance used for requesting the config files
     */
    static axiosInstance: AxiosInstance = axios.create({
        method: "get",
        headers: {
            "User-Agent": "GitConfig"
        }
    });
    /**
     * Source root for config files
     */
    static source: string = "";
    /**
     * Local destination for config files
     * If this is set, it downloads all config files locally and attempts to read them from the local file before downloading
     * defaults to undefined = don't download
     */
    static local?: string = undefined;

    private static readonly configs: Map<string, GitConfig<any>> = new Map<string, GitConfig<any>>();

    /**
     * Get an existing config or initialize a new one
     *
     * @param file File name
     * @param source (optional) file source root, defaults to GitConfig#source
     */
    public static async get<C>(file: string, source: string = GitConfig.source): Promise<GitConfig<C>> {
        const fullFile = new URL(file, source).href;
        let config = GitConfig.configs.get(fullFile);
        if (config) {
            // use existing
            return config;
        }
        config = new GitConfig<any>(file, source);
        GitConfig.configs.set(fullFile, config);
        if (GitConfig.local) {
            // Attempt to read the local version
            await config.readLocalFile();
        }
        return config.invalidate().then(ignored => {
            return config as GitConfig<C>;
        });
    }

    /**
     * Invalidate all known configs
     * returns false if any of the configs failed to invalidate
     */
    public static invalidateAll(): Promise<boolean> {
        let promises: Promise<boolean>[] = [];
        GitConfig.configs.forEach(v => {
            promises.push(v.invalidate());
        })
        return Promise.all(promises).then(results => {
            for (let r of results) {
                if (!r) return false;
            }
            return true;
        });
    }

    /// ============================================= ///

    private readonly file: string;
    private readonly source: string;
    private readonly fullFile: string;
    private _content: C;

    private constructor(file: string, source: string) {
        this.file = file;
        this.source = source;
        this.fullFile = new URL(file, source).href;
        this._content = <any>{};
    }

    public get content(): C {
        return this._content;
    }

    public mergedWith(other: any): C {
        return merge({}, this.content, other as C) as C;
    }

    /**
     * Invalidate this config and refresh its contents
     * returns true if the file was successfully loaded and parsed (may reject the promise on errors)
     */
    public async invalidate(): Promise<boolean> {
        return GitConfig.axiosInstance.request({
            url: this.fullFile
        })
            .then(res => this.handleContentResponse(res))
            .catch(err => {
                if (!GitConfig.debug && (err.response || err.request)) {
                    return false;
                }
                throw err;
            });
    }

    private async handleContentResponse(res: AxiosResponse): Promise<boolean> {
        if (Math.floor(res.status / 100) !== 2) {
            return false;
        }
        const data = res.data;
        let json: any = {};
        if (typeof data === "object") {
            json = data;
        } else if (typeof data === "string") {
            json = JSON.parse(data as string);
        } else {
            console.warn("[GitConfig] Don't know what to do with response of type " + (typeof data));
            return false;
        }
        this._content = json;
        if (GitConfig.local) {
            await this.writeLocalFile();
        }
        return true;
    }

    private async readLocalFile(): Promise<void> {
        this._content = await readFile(join(GitConfig.local!, this.file), "utf8")
            .then(c => JSON.parse(c))
            .catch(err => {
                if (!GitConfig.debug) {
                    return <any>{}
                }
                throw err;
            });
    }

    private async writeLocalFile(): Promise<void> {
        return writeFile(join(GitConfig.local!, this.file), JSON.stringify(this._content, null, 2), "utf8")
            .catch(err => {
                if (GitConfig.debug) {
                    throw err;
                }
            })
    }

}
