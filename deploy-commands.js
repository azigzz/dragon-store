require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const token = process.env.DISCORD_TOKEN?.trim();
const clientId = process.env.CLIENT_ID?.trim();
const guildId = process.env.GUILD_ID?.trim();

if (!token || !clientId || !guildId) {
  console.error("Preencha DISCORD_TOKEN, CLIENT_ID e GUILD_ID.");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("configds")
    .setDescription("Abre o configurador visual da loja."),
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Envia o painel de ticket no canal configurado."),
  new SlashCommandBuilder()
    .setName("setup-atendimento")
    .setDescription("Cria/atualiza o painel ON/OFF dos ADMs e recebedores Pix."),
  new SlashCommandBuilder()
    .setName("configpix")
    .setDescription("Configura seu nome, chave Pix e QR Code para assumir compras."),
  new SlashCommandBuilder()
    .setName("status-loja")
    .setDescription("Mostra a configuração atual da loja.")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Registrando comandos...");
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("Comandos registrados.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
