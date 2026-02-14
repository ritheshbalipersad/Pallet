import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.join(process.cwd(), '.env') });

import('./seed-mssql').then((m) => m.run()).then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
