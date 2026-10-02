import { createClient } from '@libsql/client';

const url = 'libsql://svem-project-sriramreddy.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA5MzQ1NzUsImlkIjoiMDFhMGZjMDMtYTUwMS03OTZjLTkyNDgtMmY3NjlkZmZjNmYzIiwia2lkIjoiZVl5c24xMXBHX3Nhb0dSbGpsWTV1OTZUUDktZ2F3VjhHMFU5U0NPSUk0ayIsInJpZCI6ImNlYjUyNDg3LTNmZTAtNDIzMC04OTc5LTNjZjJlYWNhNzNmNCJ9.w9tksliNaiRM90_FNAhnhJCNTI-cQxjqo8rEoLbSOfX-TyzNbllHdw_GC0eocWPgEPT5RwialT2eIJTynB1DCQ';

const client = createClient({ url, authToken });

async function main() {
  try {
    console.log('Connecting to Turso...');
    const result = await client.execute('SELECT 1 as connected;');
    console.log('Successfully connected to Turso database!', result.rows);

    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Existing tables:', tables.rows.map(r => r.name));
  } catch (err) {
    console.error('Turso connection error:', err);
  }
}

main();
