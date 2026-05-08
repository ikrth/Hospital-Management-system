const mongoose = require('mongoose');
const connectDB = require('../../config/db.js');
const { listBackups, rollbackToBackup, createBackup, clearDatabase } = require('./backup.js');

const command = process.argv[2];
const argument = process.argv[3];

async function run() {
  await connectDB();

  switch(command) {
    case 'list':
      await listBackups();
      break;
      
    case 'backup':
      await createBackup(argument || 'manual');
      break;
      
    case 'rollback':
      if (!argument) {
        console.error('Please provide backup filename');
        console.error('Usage: node scripts/db/rollback.js rollback backup_filename.json');
        process.exit(1);
      }
      console.log('Creating safety backup before rollback...');
      await createBackup('pre-rollback');
      await rollbackToBackup(argument);
      break;
      
    case 'clear':
      console.log('Creating safety backup before clear...');
      await createBackup('pre-clear');
      await clearDatabase(true);
      break;
      
    case 'reseed':
      console.log('Creating safety backup before reseed...');
      await createBackup('pre-reseed');
      await clearDatabase(true);
      const { seedDatabase } = require('../seed.js');
      await seedDatabase();
      break;
      
    default:
      console.log('Database Management Commands:');
      console.log('  list              — List all available backups');
      console.log('  backup [label]    — Create a backup with optional label');
      console.log('  rollback [file]   — Rollback to a specific backup');
      console.log('  clear             — Clear all data (auto-backs up first)');
      console.log('  reseed            — Clear and reseed with demo data');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/db/rollback.js list');
      console.log('  node scripts/db/rollback.js backup before-testing');
      console.log('  node scripts/db/rollback.js rollback backup_before-testing_2024-01-01.json');
      console.log('  node scripts/db/rollback.js reseed');
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
