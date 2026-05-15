/**
 * PM2 process manager configuration.
 *
 * Quick start on the VPS:
 *   pnpm install --prod=false
 *   pnpm build
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save
 *   pm2 startup        # then run the command it prints, to survive reboots
 *
 * Operate:
 *   pm2 status
 *   pm2 logs wood-api
 *   pm2 reload wood-api    # zero-downtime restart after deploy
 *   pm2 monit
 *
 * Memory cap (`max_memory_restart`) should be ~70% of the VPS RAM divided by
 * the number of instances. Default 512M assumes a 1 GB box running both the
 * API and Postgres+Redis on the same host — adjust to your actual RAM.
 */
module.exports = {
  apps: [
    {
      name: "wood-api",
      script: "dist/server.js",
      cwd: __dirname,
      // `fork` is the safe default. Switch to "cluster" only after you've
      // verified that everything in the codebase is process-safe (no
      // in-memory state that callers assume is shared).
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      // If the process dies more than 10 times in <min_uptime, PM2 stops
      // trying — that's a real crash loop, not a flap.
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 4000,
      kill_timeout: 20_000, // matches the 20s force-exit in server.ts
      listen_timeout: 15_000,
      wait_ready: false,
      // Node heap cap. Should be < max_memory_restart to give PM2 room
      // to act before the kernel OOM killer fires.
      node_args: "--max-old-space-size=400",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
        LOG_MEMORY: "true",
      },
      // Logs (rotate with: pm2 install pm2-logrotate)
      out_file: "./logs/api-out.log",
      error_file: "./logs/api-err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      // Dedicated worker. Disabled by default — enable by running:
      //   pm2 start ecosystem.config.js --only wood-worker
      // and setting RUN_QUEUE_WORKER=true in .env.production.
      name: "wood-worker",
      script: "dist/workerOnly.js",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 4000,
      kill_timeout: 20_000,
      node_args: "--max-old-space-size=300",
      max_memory_restart: "384M",
      env: {
        NODE_ENV: "production",
        RUN_QUEUE_WORKER: "true",
      },
      out_file: "./logs/worker-out.log",
      error_file: "./logs/worker-err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
