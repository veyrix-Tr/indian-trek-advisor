import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE env vars. Check .env')
  process.exit(1)
}

const admin = createClient(url, key)

const { data: profiles, error: profileError } = await admin
  .from('profiles')
  .select('id, name, email')
  .eq('account_type', 'trekker')

if (profileError) {
  console.error('Error fetching trekker profiles:', profileError.message)
  process.exit(1)
}

if (!profiles || profiles.length === 0) {
  console.log('No trekker accounts found in profiles table.')
  process.exit(0)
}

console.log(`\nTrekker accounts (${profiles.length}):\n`)
for (const p of profiles) {
  console.log(`- ${p.name || '(no name)'} <${p.email || '(no email)'}> [id: ${p.id}]`)
}

console.log('\nResetting passwords to "test1234"...\n')

for (const p of profiles) {
  const { error } = await admin.auth.admin.updateUserById(p.id, {
    password: 'test1234',
  })
  if (error) {
    console.error(`✗ ${p.email}: ${error.message}`)
  } else {
    console.log(`✓ ${p.email}: password reset`)
  }
}