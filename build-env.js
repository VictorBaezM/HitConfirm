const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'js', 'supabase.js');
if (!fs.existsSync(filePath)) {
  console.error(`Error: ${filePath} not found.`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const defaultUrl = 'https://jepptvwtzyinhqmapnzo.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

const url = process.env.SUPABASE_URL || defaultUrl;
const key = process.env.SUPABASE_ANON_KEY || defaultKey;

content = content.replace('%%SUPABASE_URL%%', url);
content = content.replace('%%SUPABASE_ANON_KEY%%', key);

fs.writeFileSync(filePath, content);
console.log('Successfully injected Supabase environment configurations.');
