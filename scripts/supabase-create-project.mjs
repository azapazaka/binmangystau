const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'your_access_token_here';
const ORG_ID = process.env.SUPABASE_ORG_ID || 'your_org_id_here';
const DB_PASS = process.env.SUPABASE_DB_PASS || 'your_db_password_here';

async function api(method, path, body) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`API ${method} ${path} → ${res.status}: ${text}`); }
  return res.json();
}

async function main() {
  console.log('Creating project "aka bin"...');
  const project = await api('POST', '/projects', {
    name: 'aka bin',
    organization_id: ORG_ID,
    db_pass: DB_PASS,
    region: 'eu-central-1',
    plan: 'free',
  });
  const ref = project.id;
  console.log(`Project created: ref=${ref}`);
  console.log('Polling until ready...');
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await api('GET', `/projects/${ref}`);
    process.stdout.write(`  status: ${status.status}\r`);
    if (status.status === 'ACTIVE_HEALTHY') { console.log('\nProject is ready!'); break; }
    if (i === 39) throw new Error('Timed out');
  }
  const keys = await api('GET', `/projects/${ref}/api-keys`);
  const anon = keys.find(k => k.name === 'anon')?.api_key;
  const service = keys.find(k => k.name === 'service_role')?.api_key;
  console.log('\n=== CREDENTIALS ===');
  console.log(`NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${service}`);
  console.log(`PROJECT_REF=${ref}`);
  console.log('===================');
}
main().catch(e => { console.error(e.message); process.exit(1); });
