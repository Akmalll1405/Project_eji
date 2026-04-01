const bcrypt = require('bcryptjs')

async function main() {
  const password = 'password123'
  const hash = await bcrypt.hash(password, 10)
  console.log('Hash:', hash)
  
  const isMatch = await bcrypt.compare(password, hash)
  console.log('Match:', isMatch)
}

main()
