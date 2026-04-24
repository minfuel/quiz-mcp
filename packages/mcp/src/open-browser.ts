import open from "open";

export type OpenBrowser = (url: string) => Promise<void>;

export const defaultOpenBrowser: OpenBrowser = async (url) => {
  await open(url);
};
