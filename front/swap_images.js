const fs = require('fs');
const path = require('path');

const rootFolder = "./images/newFirms";   // путь к папке (можно передать)
const dryRun = false;                        // true = только показать, false = делать

const imageExtensions = new Set(['.png']);

function isImage(filename) {
  return imageExtensions.has(path.extname(filename).toLowerCase());
}

function processFolder(folderPath) {
  let files;
  try {
    files = fs.readdirSync(folderPath);
  } catch (err) {
    return;
  }

  // Берём только изображения и сортируем по имени
  const images = files
    .filter(isImage)
    .map(name => ({
      name: name,
      fullPath: path.join(folderPath, name)
    }))
    .sort((a, b) => a.name.localeCompare(b.name)); // сортировка по алфавиту

  if (images.length < 2) {
    return; // меньше 2 изображений — пропускаем
  }

  const img1 = images[0];
  const img2 = images[1];

  console.log(`\nПапка: ${folderPath}`);
  console.log(`   Меняем местами первые два:`);
  console.log(`   1. ${img1.name}`);
  console.log(`   2. ${img2.name}`);

  if (dryRun) return;

  const tempName = `___temp_swap_${Date.now()}${path.extname(img1.name)}`;
  const tempPath = path.join(folderPath, tempName);

  try {
    // Безопасное переименование: img1 → temp, img2 → img1, temp → img2
    fs.renameSync(img1.fullPath, tempPath);
    fs.renameSync(img2.fullPath, img1.fullPath);
    fs.renameSync(tempPath, img2.fullPath);

    console.log(`   ✓ Успешно поменяны местами`);
  } catch (err) {
    console.error(`   ✕ Ошибка: ${err.message}`);
  }
}

function walkDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath);   // идём в подпапки
    }
  }

  // обрабатываем текущую папку
  processFolder(dir);
}

// ===================== ЗАПУСК =====================
console.log(`Запуск скрипта для папки: ${path.resolve(rootFolder)}`);
if (dryRun) console.log('=== РЕЖИМ ПРОСМОТРА (только показываем) ===');

walkDir(rootFolder);

console.log('\nГотово!');