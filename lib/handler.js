const fs = require('fs');
const { plugins } = require('./loader');
const config = require('../config');

async function handleMessage(sock, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!texto) return;

    const remitente = msg.key.remoteJid;

    if (texto.startsWith(config.prefix)) {
        const args = texto.slice(config.prefix.length).trim().split(/ +/);
        const comando = args.shift().toLowerCase();

        if (plugins.has(comando)) {
            try {
                const plugin = plugins.get(comando);
                await plugin.run({ sock, msg, remitente, args, plugins, PREFIX: config.prefix });
            } catch (error) {
                console.error(`Error en comando ${comando}:`, error);
                
                // Guardar error en archivo
                const logError = `[${new Date().toISOString()}] Comando: ${comando}\nError: ${error.stack || error.message}\n\n`;
                fs.appendFileSync('errors.log', logError);
                
                await sock.sendMessage(remitente, { text: `❌ Error en ${config.prefix}${comando}. Usa ${config.prefix}error para ver el detalle.` });
            }
        }
    }
}

module.exports = { handleMessage };
