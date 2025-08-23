# DNS Configuration for softlyplease.com

## Prerequisites
1. Your Mac's public IP address
2. Access to Namecheap DNS settings
3. Port 3000 open in your Mac's firewall (or use port forwarding)

## Step 1: Find Your Mac's Public IP
Visit one of these sites to get your public IP:
- https://whatismyipaddress.com/
- https://www.google.com/search?q=what+is+my+ip
- `curl -s https://api.ipify.org`

**Your public IP:** __________

## Step 2: Configure Namecheap DNS Settings

### Option A: Point domain directly to your Mac (Recommended)
1. Log into Namecheap account
2. Go to Domain List → Manage → Advanced DNS
3. Delete existing A records for `@` (root domain)
4. Add new A record:
   - Type: `A`
   - Host: `@` (or leave empty)
   - Value: `YOUR_PUBLIC_IP`
   - TTL: `300` (5 minutes)

### Option B: Use subdomain (if you want to keep existing setup)
1. Log into Namecheap account  
2. Go to Domain List → Manage → Advanced DNS
3. Add new A record:
   - Type: `A`
   - Host: `api` (or `compute`, `rhino`, etc.)
   - Value: `YOUR_PUBLIC_IP`
   - TTL: `300` (5 minutes)

**Note:** If you're using a subdomain, update your .env file:
```
RHINO_COMPUTE_URL=http://api.softlyplease.com:3000/
```

## Step 3: Configure Port Forwarding (if needed)

### For macOS:
1. System Settings → Network → Advanced → Port Forwarding
2. Add rule:
   - Public Ports: `80, 443, 3000`
   - Private Ports: `80, 443, 3000`
   - Protocol: `TCP`
   - Forward to: Your Mac's local IP

### Alternative: Use a reverse proxy like nginx
```bash
# Install nginx
brew install nginx

# Configure nginx (example config)
cat > /usr/local/etc/nginx/servers/rhino-compute.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name softlyplease.com api.softlyplease.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# Start nginx
sudo nginx
```

## Step 4: Test DNS Configuration

1. Wait 5-30 minutes for DNS propagation
2. Test with:
```bash
# Test DNS resolution
nslookup softlyplease.com

# Test connectivity
curl -I http://softlyplease.com
```

## Step 5: SSL/HTTPS Setup (Optional but Recommended)

### Using Let's Encrypt (free SSL)
```bash
# Install certbot
brew install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d softlyplease.com

# Configure nginx for HTTPS (add to nginx config)
server {
    listen 443 ssl http2;
    server_name softlyplease.com;
    
    ssl_certificate /etc/letsencrypt/live/softlyplease.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/softlyplease.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }
}
```

## Troubleshooting

### Common Issues:

1. **DNS not propagating**: Wait longer (up to 24 hours), check with different DNS servers
2. **Port not accessible**: Check firewall settings, port forwarding
3. **SSL issues**: Ensure certificate paths are correct, check renewal

### Useful Commands:
```bash
# Check DNS
dig softlyplease.com

# Check port connectivity from outside
telnet softlyplease.com 80

# Check local server
curl http://localhost:3000/version

# Check nginx status
sudo nginx -t
sudo nginx -s reload
```

## Security Considerations
- Consider using a VPN for additional security
- Regularly update your Mac's security
- Monitor access logs
- Use HTTPS in production
- Implement rate limiting if needed
