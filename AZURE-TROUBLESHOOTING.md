# Azure VM Rhino Compute Troubleshooting

## 🔍 **Current Status**
- Azure VM IP: 4.206.116.20
- Target Port: 6500
- Connection Status: ❌ TIMEOUT

## 🛠️ **Required Azure VM Setup**

### 1. Verify VM is Running
1. Go to Azure Portal → Virtual Machines
2. Check if your VM shows "Running" status
3. If "Stopped", start the VM

### 2. Check Network Security Group (Firewall)
1. Azure Portal → Virtual Machines → Your VM → Networking
2. Click on "Network security group"
3. Add inbound rule for port 6500:
   - **Name**: RhinoCompute
   - **Priority**: 1000
   - **Source**: Any (or your specific IP)
   - **Source port ranges**: *
   - **Destination**: Any
   - **Destination port ranges**: 6500
   - **Protocol**: TCP
   - **Action**: Allow

### 3. Verify Public IP Address
1. Azure Portal → Virtual Machines → Your VM → Overview
2. Check the "Public IP address" field
3. If it doesn't match 4.206.116.20, update the .env file

### 4. Ensure Rhino Compute is Installed & Running
On your Azure VM, verify:
1. Rhino 8 is installed
2. Rhino.Compute plugin is installed
3. Rhino.Compute service is running on port 6500

### 5. Check Windows Firewall (if applicable)
On Azure VM:
1. Control Panel → System and Security → Windows Defender Firewall
2. Allow port 6500 for Rhino.Compute.exe

## 🔧 **Test Commands to Run After Fixes**

```bash
# Test connectivity
ping 4.206.116.20

# Test port access
nc -zv 4.206.116.20 6500

# Test Rhino Compute endpoint
curl http://4.206.116.20:6500/version

# Test with API key (if required)
curl -H "Authorization: Bearer p2robot-13a6-48f3-b24e-2025computeX" http://4.206.116.20:6500/version
```

## 📋 **Next Steps**
1. Check Azure Portal VM status
2. Verify firewall settings
3. Confirm public IP address
4. Ensure Rhino.Compute is running
5. Re-run connection tests

## 🚨 **Common Issues**
- VM stopped/deallocated
- Firewall blocking port 6500
- IP address changed
- Rhino.Compute service not started
- Windows Firewall blocking connections

## 📞 **If Issues Persist**
- Verify VM resource group and region
- Check Azure subscription status
- Confirm VM size has enough resources
- Review Azure activity logs for errors
