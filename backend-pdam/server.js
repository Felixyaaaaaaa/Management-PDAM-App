import "dotenv/config.js";
console.log('[✓] Env loaded');

import app from "./src/app.js";
console.log('[✓] App initialized');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[✓] Server running on port ${PORT}`);
  console.log('[✓] Application ready to accept requests\n');
});
  