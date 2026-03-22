import bcrypt from "bcrypt";

async function testNewHash() {
  const password = "Admin123!@#";
  
  console.log("Creating new hash...");
  const newHash = await bcrypt.hash(password, 12);
  console.log("New hash:", newHash);
  
  console.log("Testing new hash verification...");
  const isValid = await bcrypt.compare(password, newHash);
  console.log("Password valid with new hash:", isValid);
}

testNewHash();
