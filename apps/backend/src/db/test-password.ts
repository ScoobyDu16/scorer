import bcrypt from "bcrypt";

async function testPassword() {
  const password = "Admin123!@#";
  const hash = "$2b$12$8dQkGLPSMjlGeWZfgFY49eUuI1BrhTbDzfLXaEgzZbtcLDq49oM7a";
  
  console.log("Testing password verification...");
  
  const isValid = await bcrypt.compare(password, hash);
  console.log("Password valid:", isValid);
  
  // Test with wrong password
  const isInvalid = await bcrypt.compare("wrongpassword", hash);
  console.log("Wrong password valid:", isInvalid);
}

testPassword();
