export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { default: pg } = await import("pg");
    const path = await import("path");

    console.log("Running migrations on startup...");
    const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/itadakimasu_db";
    const client = new pg.Client({ connectionString });
    try {
      await client.connect();

      // Ensure the location column exists on d_cpm_clients, fixing potential migration table schema drift
      await client.query(`
        ALTER TABLE d_cpm_clients ADD COLUMN IF NOT EXISTS location text;
      `);
      console.log("Database schema pre-check passed successfully.");

      const db = drizzle(client);
      await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
      console.log("Startup migrations applied successfully!");

      // Data migration to merge REJECTED and WITHDRAWN statuses into CANCELLED
      console.log("Running data migration for order statuses...");
      
      // 1. Ensure CANCELLED status exists
      await client.query(`
        INSERT INTO d_cpm_order_status (status_name) 
        VALUES ('CANCELLED') 
        ON CONFLICT (status_name) DO NOTHING;
      `);

      // Get CANCELLED status ID
      const cancelledRes = await client.query(`
        SELECT id FROM d_cpm_order_status WHERE status_name = 'CANCELLED';
      `);
      
      if (cancelledRes.rows.length > 0) {
        const cancelledId = cancelledRes.rows[0].id;

        // Get IDs of REJECTED and WITHDRAWN
        const oldStatusesRes = await client.query(`
          SELECT id, status_name FROM d_cpm_order_status WHERE status_name IN ('REJECTED', 'WITHDRAWN');
        `);

        if (oldStatusesRes.rows.length > 0) {
          const oldIds = oldStatusesRes.rows.map((row: any) => row.id);

          // 2. Update orders status_id
          await client.query(`
            UPDATE f_cpm_orders 
            SET status_id = $1 
            WHERE status_id = ANY($2::text[]);
          `, [cancelledId, oldIds.map(String)]);

          // 3. Update order history from_status_id
          await client.query(`
            UPDATE f_cpm_order_history 
            SET from_status_id = $1 
            WHERE from_status_id = ANY($2::text[]);
          `, [cancelledId, oldIds.map(String)]);

          // 4. Update order history to_status_id
          await client.query(`
            UPDATE f_cpm_order_history 
            SET to_status_id = $1 
            WHERE to_status_id = ANY($2::text[]);
          `, [cancelledId, oldIds.map(String)]);

          // 5. Delete old statuses
          await client.query(`
            DELETE FROM d_cpm_order_status 
            WHERE id = ANY($1::text[]);
          `, [oldIds.map(String)]);
          
          console.log("Order statuses merged successfully into CANCELLED!");
        }
      }
    } catch (err) {
      console.error("Startup migration failed:", err);
    } finally {
      await client.end();
    }
  }
}
