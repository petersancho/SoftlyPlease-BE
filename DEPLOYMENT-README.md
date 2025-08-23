# Rhino Compute AppServer Deployment Guide

## Overview
This guide walks through deploying the Rhino Compute AppServer with:
- Node.js app server running on your Mac
- Rhino Compute server running on Azure VM
- Domain configuration via Namecheap DNS

## Quick Start

### 1. Configure Environment
Edit the `.env` file with your Azure VM details:
```bash
# Replace with your actual values
RHINO_COMPUTE_URL=http://your-azure-vm-ip:6500/
RHINO_COMPUTE_KEY=your-actual-api-key-here
PORT=3000
NODE_ENV=production
```

### 2. Setup and Test
```bash
# Run setup script
./setup-production.sh

# Test connection to Azure VM
node test-connection.js
```

### 3. Start Production Server
```bash
# Start with PM2
npm run start:prod

# Check status
npm run status

# View logs
npm run logs
```

### 4. Configure DNS
Follow the instructions in `DNS-SETUP.md` to configure Namecheap DNS settings.

## Architecture
```
┌─────────────────┐    HTTP/HTTPS    ┌──────────────────────┐
│   Client Apps   │◄────────────────►│  Mac (Node.js Server)│
│   (Web/Mobile)  │                  │     Port 3000       │
└─────────────────┘                  └──────────────────────┘
                                                 │
                                                 │ HTTP
                                                 ▼
                                        ┌─────────────────┐
                                        │   Azure VM      │
                                        │ Rhino Compute   │
                                        │   Port 6500     │
                                        └─────────────────┘
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start in development mode |
| `npm run start:prod` | Start in production with PM2 |
| `npm run stop:prod` | Stop production server |
| `npm run restart:prod` | Restart production server |
| `npm run status` | Check PM2 status |
| `npm run logs` | View application logs |
| `./setup-production.sh` | Setup and validate configuration |

## Testing Your Deployment

### Test Endpoints
```bash
# List available definitions
curl http://localhost:3000/

# Test specific definition
curl http://localhost:3000/definition/beam.gh

# Test solve endpoint
curl -X POST http://localhost:3000/solve \
  -H "Content-Type: application/json" \
  -d '{"definition":"beam.gh","inputs":{}}'
```

### Test with Browser
1. Open http://localhost:3000/examples/
2. Try the interactive examples
3. Test http://localhost:3000/view to see available definitions

## Monitoring and Maintenance

### PM2 Commands
```bash
# Monitor processes
npm run status

# View logs
npm run logs

# Restart if needed
npm run restart:prod

# Stop server
npm run stop:prod
```

### Log Locations
- Application logs: `~/.pm2/logs/rhino-compute-appserver-out.log`
- Error logs: `~/.pm2/logs/rhino-compute-appserver-error.log`

### Auto-start on Boot (Optional)
```bash
# Generate startup script
./node_modules/.bin/pm2 startup

# Save current process list
./node_modules/.bin/pm2 save
```

## Troubleshooting

### Connection Issues
1. **Azure VM not reachable**: Check VM status, firewall rules, IP address
2. **API Key issues**: Verify key in Azure VM and .env file
3. **Port issues**: Ensure ports 6500 (Azure) and 3000 (Mac) are open

### DNS Issues
1. **Domain not resolving**: Wait for DNS propagation (5-30 minutes)
2. **SSL issues**: Check certificate configuration
3. **Port forwarding**: Verify router/firewall settings

### Performance Issues
1. **High memory usage**: Monitor with `npm run status`
2. **Slow responses**: Check network latency to Azure VM
3. **Crashes**: Check error logs with `npm run logs`

## Security Checklist
- [ ] Firewall configured properly
- [ ] API keys secured in environment variables
- [ ] HTTPS enabled for production
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Rate limiting implemented (if needed)

## Backup and Recovery
1. **Environment configuration**: Keep `.env` file backed up
2. **PM2 configuration**: PM2 processes auto-restart on failure
3. **Database/logs**: Consider log rotation for long-term monitoring

## Support
- Check the `/docs` folder for additional documentation
- Review PM2 documentation for advanced process management
- Monitor Azure VM performance and costs
