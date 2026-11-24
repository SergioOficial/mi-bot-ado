// plugins/sticker-audio.js
const { downloadMediaMessage } = require('@ado/baileys');

// Función interna que hace el "truco" del sidecar
async function sendModdedSticker(sock, jid, originalSticker) {
    const message = {
        stickerMessage: {
            url: originalSticker.url,
            fileSha256: originalSticker.fileSha256,
            fileEncSha256: originalSticker.fileEncSha256,
            mediaKey: originalSticker.mediaKey,
            mimetype: originalSticker.mimetype || "image/webp",
            directPath: originalSticker.directPath,
            fileLength: originalSticker.fileLength,
            mediaKeyTimestamp: originalSticker.mediaKeyTimestamp,
            isAnimated: originalSticker.isAnimated || true,
            stickerSentTs: Date.now().toString(),
            isAvatar: false,
            isAiSticker: false,
            isLottie: false,
            firstFrameLength: originalSticker.firstFrameLength,
            firstFrameSidecar: originalSticker.firstFrameSidecar,
            accessibilityLabel: ""
        }
    };
    await sock.sendMessage(jid, message);
}

module.exports = {
    name: 'sa',
    category: 'media',
    run: async ({ sock, msg, remitente }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
            return sock.sendMessage(remitente, { text: '❌ Responde a un sticker con audio (mod).' });
        }

        // Verificamos si el sticker tiene los metadatos de audio
        if (!quoted.stickerMessage.firstFrameSidecar) {
            return sock.sendMessage(remitente, { text: '❌ Este sticker no tiene audio incrustado.' });
        }

        await sock.sendMessage(remitente, { text: '🔄 Reenviando sticker con audio (Mod)...' });
        await sendModdedSticker(sock, remitente, quoted.stickerMessage);
    }
}