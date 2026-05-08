const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../backups');

async function createBackup(label = 'manual') {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup_${label}_${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, `${backupName}.json`);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  const backup = {
    createdAt: new Date().toISOString(),
    label,
    database: mongoose.connection.name,
    collections: {}
  };
  
  for (const collection of collections) {
    const docs = await mongoose.connection.db
      .collection(collection.name)
      .find({})
      .toArray();
    backup.collections[collection.name] = docs;
    console.log(`  Backed up ${docs.length} docs from ${collection.name}`);
  }
  
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup saved: ${backupPath}`);
  return backupPath;
}

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups found.');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      const data = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, f)));
      return {
        filename: f,
        label: data.label,
        createdAt: data.createdAt,
        size: (stats.size / 1024).toFixed(2) + ' KB'
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  console.log('\nAvailable Backups:');
  console.log('==================');
  files.forEach((f, i) => {
    console.log(`${i + 1}. ${f.filename}`);
    console.log(`   Label: ${f.label} | Created: ${f.createdAt} | Size: ${f.size}`);
  });
  
  return files;
}

async function rollbackToBackup(backupFilename) {
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupFilename}`);
  }
  
  const backup = JSON.parse(fs.readFileSync(backupPath));
  console.log(`Rolling back to: ${backup.label} (${backup.createdAt})`);
  
  try {
    for (const [collectionName, docs] of Object.entries(backup.collections)) {
      const collection = mongoose.connection.db.collection(collectionName);
      
      await collection.deleteMany({});
      
      if (docs.length > 0) {
        await collection.insertMany(docs);
      }
      
      console.log(`  Restored ${docs.length} docs to ${collectionName}`);
    }
    
    console.log('Rollback completed successfully!');
    return true;
    
  } catch (error) {
    console.error('Rollback failed:', error.message);
    throw error;
  }
}

async function clearDatabase(confirm = false) {
  if (!confirm) {
    throw new Error('Pass confirm=true to clear database. This cannot be undone without a backup.');
  }
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const collection of collections) {
    await mongoose.connection.db.collection(collection.name).deleteMany({});
    console.log(`Cleared collection: ${collection.name}`);
  }
  console.log('Database cleared.');
}

module.exports = {
  createBackup,
  listBackups,
  rollbackToBackup,
  clearDatabase
};
