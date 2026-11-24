const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
// Usamos el Baileys oficial solo para descargar el archivo, que siempre está ahí
const { downloadMediaMessage } = require('@ado/baileys'); 

// --- FUNCIÓN 1: Extraer Sticker + Audio de un VIDEO usando FFmpeg ---
async function createStickerAndAudio(sock, jid, mediaBuffer, isVideo) {
    const tmpDir = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const timestamp = Date.now();
    const inputPath = path.join(tmpDir, `in_${timestamp}.mp4`);
    const stickerPath = path.join(tmpDir, `st_${timestamp}.webp`);
    const audioPath = path.join(tmpDir, `au_${timestamp}.ogg`);

    try {
        fs.writeFileSync(inputPath, mediaBuffer);
        
        // Comandos de FFmpeg
        const cmdSticker = `ffmpeg -y -i "${inputPath}" -vf "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0" -c:v libwebp -quality 80 -loop 0 -an "${stickerPath}"`;
        const cmdAudio = `ffmpeg -y -i "${inputPath}" -vn -c:a libopus -ac 1 -avoid_negative_ts make_zero "${audioPath}"`;

        await new Promise((resolve, reject) => {
            exec(`${cmdSticker} && ${cmdAudio}`, (error) => {
                if (error) reject(new Error("FFmpeg falló. Verifica que esté instalado en el hosting."));
                else resolve();
            });
        });

        // Enviamos el sticker y el audio
        await sock.sendMessage(jid, { sticker: { url: stickerPath } });
        await sock.sendMessage(jid, { audio: { url: audioPath }, mimetype: 'audio/ogg; codecs=opus', ptt: true });

    } finally {
        [inputPath, stickerPath, audioPath].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
    }
}

// --- FUNCIÓN 2: El truco del Sidecar (Sticker Mod con audio) ---
async function sendModdedSticker(sock, jid, originalSticker) {
    // Reconstruimos el sticker inyectando los metadatos del sidecar
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

// --- EL COMANDO ---
module.exports = {
    name: 'sa',
    category: 'media',
    run: async ({ sock, msg, remitente }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(remitente, { text: 'Responde a un *video*, *audio* o *sticker mod* con el comando.' });
        }

        const type = Object.keys(quoted)[0];

        // OPCIÓN A: Si respondes a un sticker (Truco Mod)
        if (type === 'stickerMessage') {
            const originalSticker = quoted.stickerMessage;
            
            // Verificamos si tiene los metadatos del audio (sidecar)
            if (originalSticker.firstFrameSidecar) {
                await sock.sendMessage(remitente, { text: '🔄 Reenviando sticker con audio (Mod)...' });
                await sendModdedSticker(sock, remitente, originalSticker);
            } else {
                await sock.sendMessage(remitente, { text: '❌ Este sticker no tiene audio incrustado.' });
            }
            return;
        }

        // OPCIÓN B: Si respondes a un video o audio (FFmpeg)
        if (type === 'videoMessage' || type === 'audioMessage') {
            await sock.sendMessage(remitente, { text: '⏳ Procesando video con FFmpeg...' });
            try {
                const contextInfo = msg.message.extendedTextMessage.contextInfo;
                const target = { key: { remoteJid: remitente, id: contextInfo.stanzaId, fromMe: false }, message: quoted };
                
                const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
                
                await createStickerAndAudio(sock, remitente, buffer, type === 'videoMessage');
            } catch (error) {
                console.error(error);
                await sock.sendMessage(remitente, { text: `❌ Error procesando media: ${error.message}` });
            }
            return;
        }

        return sock.sendMessage(remitente, { text: '❌ Formato no soportado.' });
    }
}