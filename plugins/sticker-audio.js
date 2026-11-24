const { downloadMediaMessage, sendModdedSticker } = require('@ado/baileys');

module.exports = {
    name: 'sa',
    category: 'media',
    run: async ({ sock, msg, remitente }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
            return sock.sendMessage(remitente, { text: '❌ Responde a un sticker con audio (mod).' });
        }

        const contextInfo = msg.message.extendedTextMessage.contextInfo;
        const target = { key: { remoteJid: remitente, id: contextInfo.stanzaId, fromMe: false }, message: quoted };

        // Descargamos el sticker original (esto solo baja el WebP, sin audio, pero mantiene la estructura)
        const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });

        // Enviamos el sticker inyectando los metadatos del mod
        await sendModdedSticker(sock, remitente, quoted, buffer);
    }
}