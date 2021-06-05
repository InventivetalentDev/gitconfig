import { join } from "path";
import axios, { AxiosInstance } from "axios";

export class GitConfig<C> {

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

    private static readonly configs: Map<string, GitConfig<any>> = new Map<string, GitConfig<any>>();

    /**
     * Get an existing config or initialize a new one
     *
     * @param file File name
     * @param source (optional) file source root, defaults to GitConfig#source
     */
    public static async get<C>(file: string, source: string = GitConfig.source): Promise<GitConfig<C>> {
        const fullFile = join(source, file);
        let config = GitConfig.configs.get(fullFile);
        if (config) {
            // use existing
            return config;
        }
        config = new GitConfig<any>(fullFile);
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
    private content: C;

    private constructor(file: string) {
        this.file = file;
        this.content = <any>{};
    }

    /**
     * Invalidate this config and refresh its contents
     * returns true if the file was successfully loaded and parsed (may reject the promise on errors)
     */
    public async invalidate(): Promise<boolean> {
        return GitConfig.axiosInstance.request({
            url: this.file
        }).then(res => {
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
            this.content = json;
            return true;
        })
    }


}
