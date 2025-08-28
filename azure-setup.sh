#!/bin/bash
# Azure Rhino Compute Docker Setup Script

# Configuration
RESOURCE_GROUP="rhino-compute-rg"
LOCATION="eastus"
VM_NAME="rhino-compute-vm"
VM_SIZE="Standard_D4s_v5"  # 4 vCPU, 16GB RAM - better for Rhino Compute
ADMIN_USER="rhinoadmin"
DNS_LABEL="compute-softlyplease"  # Change this to your preferred DNS name

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up Rhino Compute on Azure with Docker${NC}"

# Login to Azure (uncomment if needed)
# az login

# Create resource group
echo -e "${YELLOW}📦 Creating resource group...${NC}"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create VM with Windows Server 2022 (for Windows containers)
echo -e "${YELLOW}🖥️  Creating Windows Server 2022 VM...${NC}"
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Win2022Datacenter \
  --admin-username $ADMIN_USER \
  --admin-password $(openssl rand -base64 16) \
  --size $VM_SIZE \
  --public-ip-sku Standard \
  --public-ip-address-dns-name $DNS_LABEL \
  --enable-auto-update \
  --patch-mode AutomaticByPlatform

# Open ports in NSG (5000 for Rhino Compute, 443 for HTTPS)
echo -e "${YELLOW}🔓 Opening ports in Network Security Group...${NC}"
az vm open-port \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --port 5000,443

# Get VM public IP
VM_IP=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --show-details \
  --query [publicIps] \
  -o tsv)

echo -e "${GREEN}✅ VM created successfully!${NC}"
echo -e "${YELLOW}🌐 Public IP: ${VM_IP}${NC}"
echo -e "${YELLOW}🌐 DNS Name: ${DNS_LABEL}.${LOCATION}.cloudapp.azure.com${NC}"

# Generate deployment commands
cat << EOF

${GREEN}📋 Next Steps:${NC}

1. ${YELLOW}RDP into your Windows VM:${NC}
   Use Azure Portal > Virtual Machines > $VM_NAME > Connect
   Username: $ADMIN_USER
   Password: (generated during VM creation)

2. ${YELLOW}Install Docker Desktop for Windows:${NC}
   Download from: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
   Install and enable Windows containers mode

3. ${YELLOW}Clone Rhino Compute repository:${NC}
   git clone https://github.com/mcneel/compute.rhino3d.git
   cd compute.rhino3d

4. ${YELLOW}Build Rhino Compute container:${NC}
   docker build --isolation=process -f Dockerfile.rhino -t rhino-compute:8 .

5. ${YELLOW}Run the container:${NC}
   docker run -d --restart=always -p 5000:5000 --name rhino-compute ^
     -e ASPNETCORE_URLS=http://*:5000 ^
     -e RHINO_TOKEN=<your_core_hour_token> ^
     -e RHINO_COMPUTE_KEY=<your_32char_api_key> ^
     rhino-compute:8

6. ${YELLOW}Verify it's working:${NC}
   curl http://localhost:5000/version

7. ${YELLOW}Update Heroku config:${NC}
   heroku config:set RHINO_COMPUTE_URL=http://$DNS_LABEL.$LOCATION.cloudapp.azure.com:5000/ -a softlyplease-appserver
   heroku config:set COMPUTE_KEY=<same_as_RHINO_COMPUTE_KEY> -a softlyplease-appserver

${GREEN}🎉 Your Rhino Compute will be available at:${NC}
${YELLOW}http://$DNS_LABEL.$LOCATION.cloudapp.azure.com:5000/${NC}

${YELLOW}⚠️  Remember to set up Azure Application Gateway for production HTTPS!${NC}

EOF
