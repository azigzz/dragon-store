require("dotenv").config();

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const config = require("../config.json");

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot online");
}).listen(PORT, () => console.log(`Health server rodando na porta ${PORT}`));

const DATA_DIR = path.join(__dirname, "..", "data");
const PANELS_FILE = path.join(DATA_DIR, "panels.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PANELS_FILE)) fs.writeFileSync(PANELS_FILE, JSON.stringify({ guilds: {} }, null, 2));
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify({ orders: {}, tickets: {} }, null, 2));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const sessions = new Map();

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function readPanels() { return readJson(PANELS_FILE, { guilds: {} }); }
function writePanels(data) { writeJson(PANELS_FILE, data); }
function readOrders() { return readJson(ORDERS_FILE, { orders: {}, tickets: {} }); }
function writeOrders(data) { writeJson(ORDERS_FILE, data); }
function random7() { return String(Math.floor(1000000 + Math.random() * 9000000)); }
function sid() { return Math.random().toString(36).slice(2, 9); }
function parseColor(hex, fallback = 0x9b00ff) {
  const clean = String(hex || "").replace("#", "");
  const n = Number.parseInt(clean, 16);
  return Number.isNaN(n) ? fallback : n;
}
function normColor(v) {
  const raw = String(v || "").trim();
  const c = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#9b00ff";
}
function validUrl(v) {
  const raw = String(v || "").trim();
  if (!raw) return true;
  try {
    const u = new URL(raw);
    return ["http:", "https:"].includes(u.protocol);
  } catch { return false; }
}
function safeName(text) {
  return String(text || "usuario")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 24) || "usuario";
}
function isAdmin(member) {
  return Boolean(member?.permissions?.has(PermissionFlagsBits.Administrator) || member?.roles?.cache?.has(config.adminRoleId));
}
function defaultPanel(guildId) {
  return {
    id: "main",
    guildId,
    channelId: "",
    title: "🌐 QnStore",
    color: "#9b00ff",
    imageUrl: "",
    thumbnailUrl: "",
    description: `🎬 **Painel de Vídeos (Packs Prontos)**\n\nTenha acesso a packs de vídeos prontos para usar em conteúdo,\nedições ou páginas de venda.\n\n📦 **O que você encontra**\n\n🎥 **Pack de Edição**\n→ Vídeos ideais para cortes, reels e criativos\n\n✂️ **Pack de Cortes**\n→ Conteúdo pronto para postar e reaproveitar\n\n💎 **Pack Lifestyle Rico**\n→ Vídeos de alto padrão (luxo, carros, viagens, etc.)\n→ Perfeitos para aumentar percepção de valor\n\n🚀 **Pra que usar?**\n✔️ Criar conteúdo mais profissional\n✔️ Aumentar engajamento nas redes\n✔️ Economizar tempo na criação`,
    products: [
      { id: "p" + random7(), name: "250 Cortes de Filmes e Séries aleatórios", price: "R$ 1,00", description: "Conteúdo pronto para postar e reaproveitar", stock: "infinito" },
      { id: "p" + random7(), name: "Pack de 100 Vídeos Lifestyle Rico", price: "R$ 1,00", description: "Vídeos de alto padrão para conteúdo", stock: "infinito" },
      { id: "p" + random7(), name: "Pack de 20K Vídeos Lifestyle Rico", price: "R$ 5,00", description: "Pack grande para criativos e páginas", stock: "infinito" },
      { id: "p" + random7(), name: "Pack de Edição de Vídeo", price: "R$ 5,00", description: "Vídeos ideais para edições e reels", stock: "infinito" }
    ],
    updatedAt: new Date().toISOString()
  };
}
function getPanel(guildId) {
  const store = readPanels();
  if (!store.guilds[guildId]) {
    store.guilds[guildId] = { panel: defaultPanel(guildId) };
    writePanels(store);
  }
  return store.guilds[guildId].panel;
}
function savePanel(guildId, panel) {
  const store = readPanels();
  if (!store.guilds[guildId]) store.guilds[guildId] = {};
  panel.updatedAt = new Date().toISOString();
  store.guilds[guildId].panel = panel;
  writePanels(store);
}
function product(panel, id) { return panel.products.find(p => p.id === id); }
function orderId(type) {
  const db = readOrders();
  let id = random7();
  while ((type === "order" && db.orders[id]) || (type === "ticket" && db.tickets[id])) id = random7();
  return id;
}

function panelEmbed(panel) {
  const e = new EmbedBuilder()
    .setTitle(panel.title || "Loja")
    .setDescription(String(panel.description || "Selecione um produto abaixo.").slice(0, 4096))
    .setColor(parseColor(panel.color));
  if (panel.imageUrl) e.setImage(panel.imageUrl);
  if (panel.thumbnailUrl) e.setThumbnail(panel.thumbnailUrl);
  return e;
}
function productSelect(panel, customId = `buy:${panel.id}`) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder("📦 Selecione um produto")
    .setMinValues(1).setMaxValues(1);
  if (!panel.products.length) {
    menu.setDisabled(true).addOptions([{ label: "Nenhum produto configurado", value: "none", description: "Use !configds para adicionar." }]);
  } else {
    menu.addOptions(panel.products.slice(0, 25).map(p => ({
      label: `🛒 ${String(p.name).slice(0, 96)}`,
      description: `💸 Valor: ${String(p.price).slice(0, 35)} | 📦 Estoque ${String(p.stock || "infinito").slice(0, 35)}`.slice(0, 100),
      value: p.id
    })));
  }
  return new ActionRowBuilder().addComponents(menu);
}
function saleMessage(panel) { return { embeds: [panelEmbed(panel)], components: [productSelect(panel)] }; }

function configEmbed(panel, ownerId) {
  const lines = panel.products.length
    ? panel.products.slice(0, 15).map((p, i) => `\`${i + 1}.\` 🛒 **${p.name}** — ${p.price} | Estoque: ${p.stock || "infinito"}`).join("\n")
    : "Nenhum produto.";
  return new EmbedBuilder()
    .setTitle("⚙️ Configurador da Loja")
    .setColor(parseColor(panel.color))
    .setDescription(`Use os botões abaixo para montar o painel igual ao da print.\n\n**Dono:** <@${ownerId}>\n**Canal de publicação:** ${panel.channelId ? `<#${panel.channelId}>` : "não definido; se publicar agora, usa este canal"}\n**Cor:** \`${panel.color}\`\n**Imagem:** ${panel.imageUrl ? "configurada ✅" : "sem imagem"}\n\n**Produtos:**\n${lines}\n\nDepois clique em **Preview** ou **Publicar painel**.`);
}
function configRows(sessionId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:title`).setLabel("Título").setEmoji("🏷️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:desc`).setLabel("Descrição").setEmoji("📝").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:image`).setLabel("Imagem").setEmoji("🖼️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:color`).setLabel("Cor").setEmoji("🎨").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:channel`).setLabel("Canal").setEmoji("📢").setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:add`).setLabel("Adicionar produto").setEmoji("➕").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:remove`).setLabel("Remover produto").setEmoji("🗑️").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:preview`).setLabel("Preview").setEmoji("👁️").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:publish`).setLabel("Publicar painel").setEmoji("🚀").setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:reset`).setLabel("Resetar exemplo").setEmoji("♻️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`cfg:${sessionId}:close`).setLabel("Fechar config").setEmoji("🔒").setStyle(ButtonStyle.Danger)
    )
  ];
}
async function refreshConfig(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return;
  try {
    const guild = await client.guilds.fetch(s.guildId);
    const ch = await guild.channels.fetch(s.channelId);
    const msg = await ch.messages.fetch(s.messageId);
    const panel = getPanel(s.guildId);
    await msg.edit({ embeds: [configEmbed(panel, s.ownerId)], components: configRows(sessionId) });
  } catch (e) { console.error("refreshConfig:", e.message); }
}
async function startConfig(channel, member, user) {
  if (!isAdmin(member)) return channel.send(`<@${user.id}> você precisa ser admin ou ter o cargo ADM configurado.`);
  const panel = getPanel(channel.guild.id);
  const sessionId = sid();
  const msg = await channel.send({ embeds: [configEmbed(panel, user.id)], components: configRows(sessionId) });
  sessions.set(sessionId, { guildId: channel.guild.id, channelId: channel.id, messageId: msg.id, ownerId: user.id, createdAt: Date.now() });
  setTimeout(() => sessions.delete(sessionId), 60 * 60 * 1000);
}
async function sessionOrReply(interaction, sessionId) {
  const s = sessions.get(sessionId);
  if (!s) {
    await interaction.reply({ content: "Sessão expirada. Use `!configds` ou `/configds` de novo.", ephemeral: true });
    return null;
  }
  if (interaction.user.id !== s.ownerId && !isAdmin(interaction.member)) {
    await interaction.reply({ content: "Só quem abriu ou um admin pode mexer nisso.", ephemeral: true });
    return null;
  }
  return s;
}
function editModal(sessionId, field, panel) {
  const modal = new ModalBuilder().setCustomId(`modal:${sessionId}:${field}`).setTitle("Configurar painel");
  if (field === "title") modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("title").setLabel("Título").setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(true).setValue(String(panel.title || "").slice(0, 256))));
  if (field === "desc") modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("desc").setLabel("Descrição").setStyle(TextInputStyle.Paragraph).setMaxLength(4000).setRequired(true).setValue(String(panel.description || "").slice(0, 4000))));
  if (field === "image") modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("image").setLabel("URL da imagem/banner").setStyle(TextInputStyle.Short).setMaxLength(500).setRequired(false).setValue(String(panel.imageUrl || "").slice(0, 500))),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("thumb").setLabel("URL do thumbnail/opcional").setStyle(TextInputStyle.Short).setMaxLength(500).setRequired(false).setValue(String(panel.thumbnailUrl || "").slice(0, 500)))
  );
  if (field === "color") modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("color").setLabel("Cor HEX").setPlaceholder("#9b00ff").setStyle(TextInputStyle.Short).setMaxLength(7).setRequired(true).setValue(String(panel.color || "#9b00ff"))));
  if (field === "channel") modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("channel").setLabel("ID do canal de publicação").setPlaceholder("Cole o ID do canal").setStyle(TextInputStyle.Short).setMaxLength(30).setRequired(false).setValue(String(panel.channelId || ""))));
  if (field === "add") modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("name").setLabel("Nome do produto").setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("price").setLabel("Valor").setPlaceholder("R$ 5,00").setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("pdesc").setLabel("Descrição curta").setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("stock").setLabel("Estoque").setPlaceholder("infinito").setStyle(TextInputStyle.Short).setMaxLength(50).setRequired(false))
  );
  return modal;
}
async function handleConfigButton(interaction) {
  const [, sessionId, action] = interaction.customId.split(":");
  const s = await sessionOrReply(interaction, sessionId);
  if (!s) return;
  const panel = getPanel(s.guildId);
  if (["title", "desc", "image", "color", "channel", "add"].includes(action)) return interaction.showModal(editModal(sessionId, action, panel));
  if (action === "preview") return interaction.reply({ content: "Preview:", ...saleMessage(panel), ephemeral: true });
  if (action === "publish") {
    const channelId = panel.channelId || interaction.channelId;
    const ch = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (!ch || !ch.isTextBased()) return interaction.reply({ content: "Canal inválido. Clique em **Canal** e cole o ID correto.", ephemeral: true });
    await ch.send(saleMessage(panel));
    return interaction.reply({ content: `Painel publicado em <#${ch.id}>.`, ephemeral: true });
  }
  if (action === "remove") {
    if (!panel.products.length) return interaction.reply({ content: "Não tem produto para remover.", ephemeral: true });
    const menu = new StringSelectMenuBuilder().setCustomId(`remove:${sessionId}`).setPlaceholder("Produto para remover").setMinValues(1).setMaxValues(1).addOptions(panel.products.slice(0,25).map(p => ({ label: String(p.name).slice(0,100), description: `Valor: ${p.price}`.slice(0,100), value: p.id })));
    return interaction.reply({ content: "Escolha o produto:", components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true });
  }
  if (action === "reset") {
    savePanel(s.guildId, defaultPanel(s.guildId));
    await refreshConfig(sessionId);
    return interaction.reply({ content: "Resetado para o exemplo da QnStore.", ephemeral: true });
  }
  if (action === "close") {
    sessions.delete(sessionId);
    return interaction.update({ content: "Configuração fechada.", embeds: [], components: [] });
  }
}
async function handleModal(interaction) {
  const [, sessionId, field] = interaction.customId.split(":");
  const s = await sessionOrReply(interaction, sessionId);
  if (!s) return;
  const panel = getPanel(s.guildId);
  if (field === "title") panel.title = interaction.fields.getTextInputValue("title").trim();
  if (field === "desc") panel.description = interaction.fields.getTextInputValue("desc").trim();
  if (field === "image") {
    const image = interaction.fields.getTextInputValue("image").trim();
    const thumb = interaction.fields.getTextInputValue("thumb").trim();
    if (!validUrl(image) || !validUrl(thumb)) return interaction.reply({ content: "URL inválida. Use link http/https ou deixe vazio.", ephemeral: true });
    panel.imageUrl = image; panel.thumbnailUrl = thumb;
  }
  if (field === "color") panel.color = normColor(interaction.fields.getTextInputValue("color"));
  if (field === "channel") {
    const channel = interaction.fields.getTextInputValue("channel").trim();
    if (channel && !/^\d{15,25}$/.test(channel)) return interaction.reply({ content: "ID de canal inválido.", ephemeral: true });
    panel.channelId = channel;
  }
  if (field === "add") {
    if (panel.products.length >= 25) return interaction.reply({ content: "Limite de 25 produtos atingido.", ephemeral: true });
    panel.products.push({
      id: "p" + random7(),
      name: interaction.fields.getTextInputValue("name").trim(),
      price: interaction.fields.getTextInputValue("price").trim(),
      description: interaction.fields.getTextInputValue("pdesc").trim() || "Produto da loja",
      stock: interaction.fields.getTextInputValue("stock").trim() || "infinito"
    });
  }
  savePanel(s.guildId, panel);
  await refreshConfig(sessionId);
  return interaction.reply({ content: "Atualizado.", ephemeral: true });
}
async function handleRemove(interaction) {
  const [, sessionId] = interaction.customId.split(":");
  const s = await sessionOrReply(interaction, sessionId);
  if (!s) return;
  const panel = getPanel(s.guildId);
  panel.products = panel.products.filter(p => p.id !== interaction.values[0]);
  savePanel(s.guildId, panel);
  await refreshConfig(sessionId);
  return interaction.update({ content: "Produto removido.", components: [] });
}

async function privateChannel(guild, user, name, parent) {
  return guild.channels.create({
    name, type: ChannelType.GuildText, parent,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
      { id: config.adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
    ]
  });
}
function cartText(order, panel) {
  if (!order.items.length) return "Carrinho vazio.";
  return order.items.map(item => {
    const p = product(panel, item.productId);
    return p ? `• 🛒 **${p.name}** — ${p.price} x${item.quantity}` : `• Produto removido x${item.quantity}`;
  }).join("\n");
}
function cartEmbed(order, panel) {
  return new EmbedBuilder()
    .setTitle(`🛒 Carrinho #${order.id}`)
    .setDescription(cartText(order, panel))
    .setColor(parseColor(panel.color))
    .addFields({ name: "Cliente", value: `<@${order.userId}>`, inline: true }, { name: "Status", value: order.status === "open" ? "Aberto" : "Fechado", inline: true });
}
function cartButtons(orderId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`call:${orderId}`).setLabel("Chamar ADM").setEmoji("📣").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`view:${orderId}`).setLabel("Ver carrinho").setEmoji("🧾").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`finish:${orderId}`).setLabel("Finalizar compra").setEmoji("✅").setStyle(ButtonStyle.Success)
  );
}
async function openCart(interaction) {
  const [, panelId] = interaction.customId.split(":");
  const panel = getPanel(interaction.guildId);
  if (panel.id !== panelId) return interaction.reply({ content: "Painel antigo. Peça para um admin publicar de novo.", ephemeral: true });
  const p = product(panel, interaction.values[0]);
  if (!p) return interaction.reply({ content: "Produto não encontrado.", ephemeral: true });
  const id = orderId("order");
  const ch = await privateChannel(interaction.guild, interaction.user, `carrinho-${safeName(interaction.user.username)}-aberto-${id}`, config.categories.cartOpen);
  const order = { id, status: "open", userId: interaction.user.id, username: interaction.user.username, channelId: ch.id, items: [{ productId: p.id, quantity: 1 }], createdAt: new Date().toISOString(), closedAt: null };
  const db = readOrders(); db.orders[id] = order; writeOrders(db);
  const intro = new EmbedBuilder().setTitle(`🛒 Carrinho aberto #${id}`).setDescription(config.messages.cartWelcome).setColor(parseColor(panel.color)).addFields({ name: "Cliente", value: `<@${interaction.user.id}>`, inline: true }, { name: "ID da compra", value: id, inline: true });
  await ch.send({ content: `<@${interaction.user.id}>`, embeds: [intro, cartEmbed(order, panel)], components: [productSelect(panel, `cartadd:${id}`), cartButtons(id)] });
  return interaction.reply({ content: `Carrinho criado: ${ch}`, ephemeral: true });
}
async function addCart(interaction) {
  const [, id] = interaction.customId.split(":");
  const db = readOrders(); const order = db.orders[id];
  if (!order || order.status !== "open") return interaction.reply({ content: "Carrinho fechado ou inexistente.", ephemeral: true });
  if (interaction.user.id !== order.userId && !isAdmin(interaction.member)) return interaction.reply({ content: "Você não pode alterar esse carrinho.", ephemeral: true });
  const panel = getPanel(interaction.guildId); const p = product(panel, interaction.values[0]);
  if (!p) return interaction.reply({ content: "Produto não encontrado.", ephemeral: true });
  const item = order.items.find(i => i.productId === p.id);
  if (item) item.quantity += 1; else order.items.push({ productId: p.id, quantity: 1 });
  db.orders[id] = order; writeOrders(db);
  await interaction.reply({ content: `Adicionado: **${p.name}** — ${p.price}`, ephemeral: true });
  return interaction.channel.send({ embeds: [cartEmbed(order, panel)] });
}
async function callAdmin(interaction, id, type = "order") {
  const db = readOrders(); const record = type === "ticket" ? db.tickets[id] : db.orders[id];
  if (!record || record.status !== "open") return interaction.reply({ content: "Canal fechado ou inexistente.", ephemeral: true });
  if (interaction.user.id !== record.userId && !isAdmin(interaction.member)) return interaction.reply({ content: "Sem permissão.", ephemeral: true });
  await interaction.channel.send({ content: `<@&${config.adminRoleId}> ${config.messages.adminCall}\nID: **${id}** | Cliente: <@${record.userId}>` });
  return interaction.reply({ content: "ADM chamado.", ephemeral: true });
}
async function viewCart(interaction, id) {
  const db = readOrders(); const order = db.orders[id];
  if (!order) return interaction.reply({ content: "Carrinho não encontrado.", ephemeral: true });
  if (interaction.user.id !== order.userId && !isAdmin(interaction.member)) return interaction.reply({ content: "Sem permissão.", ephemeral: true });
  return interaction.reply({ embeds: [cartEmbed(order, getPanel(interaction.guildId))], ephemeral: true });
}
async function finishCart(interaction, id) {
  const db = readOrders(); const order = db.orders[id];
  if (!order || order.status !== "open") return interaction.reply({ content: "Carrinho fechado ou inexistente.", ephemeral: true });
  if (config.settings.finalizeCartOnlyAdmins && !isAdmin(interaction.member)) return interaction.reply({ content: "Só admin finaliza. Clique em **Chamar ADM**.", ephemeral: true });
  order.status = "closed"; order.closedAt = new Date().toISOString(); db.orders[id] = order; writeOrders(db);
  await interaction.channel.setName(interaction.channel.name.includes("aberto") ? interaction.channel.name.replace("aberto", "fechado") : `carrinho-${safeName(order.username)}-fechado-${id}`).catch(() => null);
  if (config.categories.closed) await interaction.channel.setParent(config.categories.closed, { lockPermissions: false }).catch(() => null);
  await interaction.channel.permissionOverwrites.edit(order.userId, { ViewChannel: true, SendMessages: false, ReadMessageHistory: true }).catch(() => null);
  const thanks = config.messages.purchaseThanks.replaceAll("{id}", id);
  await interaction.channel.send({ content: `<@${order.userId}> ${thanks}`, embeds: [cartEmbed(order, getPanel(interaction.guildId))] });
  return interaction.reply({ content: `Compra #${id} finalizada.`, ephemeral: true });
}

function ticketPanelEmbed() { return new EmbedBuilder().setTitle(config.ticketPanel.title).setDescription(config.ticketPanel.description).setColor(parseColor(config.ticketPanel.embedColor, 0x2b2d31)); }
async function setupTicket(interaction) {
  const ch = await interaction.guild.channels.fetch(config.ticketPanel.channelId).catch(() => null);
  if (!ch || !ch.isTextBased()) return interaction.reply({ content: "Canal de ticket inválido no config.json.", ephemeral: true });
  const btn = new ButtonBuilder().setCustomId("openticket").setLabel(config.ticketPanel.buttonLabel).setEmoji(config.ticketPanel.buttonEmoji).setStyle(ButtonStyle.Primary);
  await ch.send({ embeds: [ticketPanelEmbed()], components: [new ActionRowBuilder().addComponents(btn)] });
  return interaction.reply({ content: `Painel de ticket enviado em <#${ch.id}>.`, ephemeral: true });
}
async function openTicket(interaction) {
  const id = orderId("ticket");
  const ch = await privateChannel(interaction.guild, interaction.user, `ticket-${safeName(interaction.user.username)}-aberto-${id}`, config.categories.ticketOpen || config.categories.cartOpen);
  const db = readOrders(); db.tickets[id] = { id, status: "open", userId: interaction.user.id, username: interaction.user.username, channelId: ch.id, createdAt: new Date().toISOString(), closedAt: null }; writeOrders(db);
  const embed = new EmbedBuilder().setTitle(`🎫 Ticket #${id}`).setDescription(config.messages.ticketWelcome).setColor(0x2b2d31).addFields({ name: "Cliente", value: `<@${interaction.user.id}>`, inline: true });
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`tcall:${id}`).setLabel("Chamar ADM").setEmoji("📣").setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId(`tclose:${id}`).setLabel("Fechar ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger));
  await ch.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
  return interaction.reply({ content: `Ticket criado: ${ch}`, ephemeral: true });
}
async function closeTicket(interaction, id) {
  const db = readOrders(); const ticket = db.tickets[id];
  if (!ticket || ticket.status !== "open") return interaction.reply({ content: "Ticket fechado ou inexistente.", ephemeral: true });
  if (interaction.user.id !== ticket.userId && !isAdmin(interaction.member)) return interaction.reply({ content: "Sem permissão.", ephemeral: true });
  ticket.status = "closed"; ticket.closedAt = new Date().toISOString(); db.tickets[id] = ticket; writeOrders(db);
  const seconds = Number(config.settings.deleteTicketAfterCloseSeconds ?? 5);
  await interaction.reply({ content: `Ticket fechado. Apagando em ${seconds}s.` });
  setTimeout(() => interaction.channel.delete(`Ticket ${id} fechado`).catch(() => null), Math.max(1, seconds) * 1000);
}

client.once("ready", () => console.log(`Bot online como ${client.user.tag}`));

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;
  if (message.content.trim().toLowerCase() === `${config.prefix || "!"}configds`) {
    await message.delete().catch(() => null);
    return startConfig(message.channel, message.member, message.author);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "configds") {
        await interaction.reply({ content: "Abri o configurador neste canal.", ephemeral: true });
        return startConfig(interaction.channel, interaction.member, interaction.user);
      }
      if (interaction.commandName === "setup-ticket") return setupTicket(interaction);
      if (interaction.commandName === "status-loja") {
        const p = getPanel(interaction.guildId);
        return interaction.reply({ content: `Produtos: **${p.products.length}**\nCanal de publicação: ${p.channelId ? `<#${p.channelId}>` : "não definido"}\nCargo ADM: <@&${config.adminRoleId}>`, ephemeral: true });
      }
    }
    if (interaction.isButton()) {
      if (interaction.customId.startsWith("cfg:")) return handleConfigButton(interaction);
      if (interaction.customId === "openticket") return openTicket(interaction);
      const [act, id] = interaction.customId.split(":");
      if (act === "call") return callAdmin(interaction, id, "order");
      if (act === "view") return viewCart(interaction, id);
      if (act === "finish") return finishCart(interaction, id);
      if (act === "tcall") return callAdmin(interaction, id, "ticket");
      if (act === "tclose") return closeTicket(interaction, id);
    }
    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal:")) return handleModal(interaction);
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith("remove:")) return handleRemove(interaction);
      if (interaction.customId.startsWith("buy:")) return openCart(interaction);
      if (interaction.customId.startsWith("cartadd:")) return addCart(interaction);
    }
  } catch (err) {
    console.error(err);
    const payload = { content: `Erro: \`${err.message}\``, ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => null);
    else await interaction.reply(payload).catch(() => null);
  }
});

const token = process.env.DISCORD_TOKEN?.trim();
if (!token) {
  console.error("DISCORD_TOKEN não configurado.");
  process.exit(1);
}
client.login(token);
