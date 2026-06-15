import { getStoreData } from "@/lib/store";
import { readSiteConfig } from "@/lib/config";
import Storefront from "@/components/Storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [store, config] = await Promise.all([getStoreData(), readSiteConfig()]);
  return <Storefront store={store} config={config} />;
}
