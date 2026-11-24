const { sendStickerWithAudio } = require('@ado/baileys');

module.exports = {
    name: 'sticker-audio',
    category: 'media',
    run: async ({ sock, msg, remitente, args, PREFIX }) => {
        // Verificamos que sea una respuesta a un mensaje
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(remitente, { text: `Responde a un *video* con ${PREFIX}sticker-audio` });
        }

        const type = Object.keys(quoted)[0];
        if (type !== 'videoMessage' && type !== 'audioMessage') {
            return sock.sendMessage(remitente, { text: '❌ Solo funciona con videos o notas de voz.' });
        }

        await sock.sendMessage(remitente, { text: '⏳ Procesando sticker con audio...' });

        try {
            // Descargamos el video/audio original
            const buffer = await sock.downloadMediaMessage({ message: quoted });

            // Llamamos a la función que creaste en TU librería
            await sendStickerWithAudio(sock, remitente, buffer, type === 'videoMessage');

        } catch (error) {
            console.error(error);
            await sock.sendMessage(remitente, { text: '❌ Error al procesar el sticker.' });
        }
    }
}
