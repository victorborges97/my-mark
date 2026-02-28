import fs from 'fs';
import path from 'path';

// Pega o caminho do arquivo passado como argumento
const filePath = "./mymark-32e3d-firebase-adminsdk-fbsvc-30121963be.json"

if (!filePath) {
    console.error('❌ Informe o caminho do arquivo JSON.');
    console.log('Uso: node json-to-base64.js ./caminho/arquivo.json');
    process.exit(1);
}

try {
    const absolutePath = path.resolve(filePath);

    // Lê o arquivo
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');

    // Valida se é um JSON válido
    JSON.parse(fileContent);

    // Converte para Base64
    const base64 = Buffer.from(fileContent).toString('base64');

    console.log('✅ Base64 do JSON:\n');
    console.log(base64);
} catch (error) {
    console.error('❌ Erro ao processar o arquivo:', error.message);
}