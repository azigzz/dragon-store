"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Headphones, ShieldCheck, ShoppingCart, Sparkles, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import CartDrawer, { type CartItem } from "@/components/CartDrawer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import type { SiteConfig, StoreData, StoreProduct } from "@/lib/types";

type StorefrontProps = {
  store: StoreData;
  config: SiteConfig;
};

const icons = [ShoppingCart, Headphones, WalletCards, Sparkles, ShieldCheck];

export default function Storefront({ store, config }: StorefrontProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const heroImage = store.imageUrl || config.heroImageUrl || "/dragon-store-hero.png";
  const products = store.products || [];
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const trust = useMemo(() => config.trustBadges.slice(0, 5), [config.trustBadges]);

  function addProduct(product: StoreProduct) {
    setCart(current => {
      const existing = current.find(item => item.product.id === product.id);
      if (existing) {
        return current.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function decreaseProduct(productId: string) {
    setCart(current => current
      .map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item)
      .filter(item => item.quantity > 0));
  }

  function removeProduct(productId: string) {
    setCart(current => current.filter(item => item.product.id !== productId));
  }

  return (
    <main>
      <Header config={config} cartCount={cartCount} onCartClick={() => setCartOpen(true)} />

      <section
        className="relative min-h-[76vh] overflow-hidden border-b border-white/10 bg-cover bg-center pt-24"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7,9,15,.98) 0%, rgba(7,9,15,.86) 36%, rgba(7,9,15,.32) 100%), url(${heroImage})`
        }}
      >
        <div className="grid-texture pointer-events-none absolute inset-0 opacity-35" />
        <div className="dragon-container relative grid min-h-[calc(76vh-96px)] content-center pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-black/35 px-3 py-2 text-xs font-bold uppercase text-emerald-100 backdrop-blur">
              <BadgeCheck className="h-4 w-4" />
              {store.source === "bot" ? "Produtos sincronizados" : "Loja pronta para vender"}
            </div>
            <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {config.heroTitle || store.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              {config.heroText || store.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#produtos"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-5 text-sm font-black text-black transition hover:bg-cyan-200"
              >
                Ver produtos
                <ArrowRight className="h-4 w-4" />
              </a>
              {config.discordInviteUrl ? (
                <a
                  href={config.discordInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[.06] px-5 text-sm font-black text-white transition hover:border-violet-300/40 hover:bg-violet-300/10"
                >
                  Entrar no Discord
                </a>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#090d15] py-8">
        <div className="dragon-container grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {trust.map((label, index) => {
            const Icon = icons[index] || ShieldCheck;
            return (
              <div key={label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[.04] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-300/10 text-emerald-100">
                  <Icon className="h-5 w-5" />
                </span>
                <strong className="text-sm text-white">{label}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section id="produtos" className="bg-[#07090f] py-14 sm:py-20">
        <div className="dragon-container">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-200">Catalogo</p>
              <h2 className="mt-2 text-3xl font-black text-white">Produtos digitais</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              Precos e nomes seguem o painel configurado no Discord. Quando o bot estiver offline, a loja usa o fallback local.
            </p>
          </div>

          {products.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  fallbackImage={heroImage}
                  onAdd={addProduct}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 p-8 text-slate-300">
              Nenhum produto disponivel agora.
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0b0f18] py-12">
        <div className="dragon-container flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-violet-200">Dragon Store</p>
            <h2 className="mt-2 text-2xl font-black text-white">Finalize pelo Discord com atendimento manual.</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-black text-black transition hover:bg-emerald-200"
          >
            <ShoppingCart className="h-4 w-4" />
            Abrir carrinho
          </button>
        </div>
      </section>

      <CartDrawer
        open={cartOpen}
        items={cart}
        store={store}
        config={config}
        onClose={() => setCartOpen(false)}
        onAdd={addProduct}
        onDecrease={decreaseProduct}
        onRemove={removeProduct}
        onClear={() => setCart([])}
      />
    </main>
  );
}
