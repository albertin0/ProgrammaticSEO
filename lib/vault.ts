import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface VaultFrontmatter {
    title: string;
    description: string;
    h1LongTailKeyword?: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lon: number;
    lungsJointsScore: number;
    pollenLevel: string;
    aqi: number;
    lastUpdated: string;
    tags: string[];
    canonicalUrl?: string;
    temperature?: number;
    weatherCondition?: string;
}

export interface VaultEntry {
    frontmatter: VaultFrontmatter;
    content: string;
    slug: { country: string; state: string; city: string };
}

const VAULT_DIR = path.join(process.cwd(), "vault");

/** Read a single MDX vault entry for [country]/[state]/[city] */
export async function getVaultEntry(
    country: string,
    state: string,
    city: string
): Promise<VaultEntry | null> {
    const filePath = path.join(VAULT_DIR, country, state, `${city}.mdx`);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    return {
        frontmatter: data as VaultFrontmatter,
        content,
        slug: { country, state, city },
    };
}

/** Walk the vault directory and return all city slugs */
export async function getAllVaultSlugs(): Promise<
    { country: string; state: string; city: string }[]
> {
    if (!fs.existsSync(VAULT_DIR)) return [];
    const slugs: { country: string; state: string; city: string }[] = [];

    const countries = fs.readdirSync(VAULT_DIR).filter((f) =>
        fs.statSync(path.join(VAULT_DIR, f)).isDirectory()
    );

    for (const country of countries) {
        const states = fs
            .readdirSync(path.join(VAULT_DIR, country))
            .filter((f) => fs.statSync(path.join(VAULT_DIR, country, f)).isDirectory());

        for (const state of states) {
            const files = fs
                .readdirSync(path.join(VAULT_DIR, country, state))
                .filter((f) => f.endsWith(".mdx"));

            for (const file of files) {
                slugs.push({ country, state, city: file.replace(".mdx", "") });
            }
        }
    }

    return slugs;
}

/** Get all unique country slugs */
export async function getCountrySlugs(): Promise<string[]> {
    if (!fs.existsSync(VAULT_DIR)) return [];
    return fs.readdirSync(VAULT_DIR).filter((f) =>
        fs.statSync(path.join(VAULT_DIR, f)).isDirectory()
    );
}

/** Get all unique state slugs for a country */
export async function getStateSlugs(country: string): Promise<string[]> {
    const dir = path.join(VAULT_DIR, country);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) =>
        fs.statSync(path.join(dir, f)).isDirectory()
    );
}

/** Get all entries for a given country */
export async function getCountryEntries(
    country: string
): Promise<{ state: string; entries: VaultEntry[] }[]> {
    const states = await getStateSlugs(country);
    const result: { state: string; entries: VaultEntry[] }[] = [];
    for (const state of states) {
        const dir = path.join(VAULT_DIR, country, state);
        const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
        const entries = await Promise.all(
            files.map((f) => getVaultEntry(country, state, f.replace(".mdx", "")))
        );
        result.push({ state, entries: entries.filter(Boolean) as VaultEntry[] });
    }
    return result;
}

/** Get all entries for a given country + state */
export async function getStateEntries(
    country: string,
    state: string
): Promise<VaultEntry[]> {
    const dir = path.join(VAULT_DIR, country, state);
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    const entries = await Promise.all(
        files.map((f) => getVaultEntry(country, state, f.replace(".mdx", "")))
    );
    return entries.filter(Boolean) as VaultEntry[];
}

/** Get a flat list of all vault entries (for sitemap, home grid, etc.) */
export async function getAllVaultEntries(): Promise<VaultEntry[]> {
    const slugs = await getAllVaultSlugs();
    const entries = await Promise.all(
        slugs.map(({ country, state, city }) =>
            getVaultEntry(country, state, city)
        )
    );
    return entries.filter(Boolean) as VaultEntry[];
}
