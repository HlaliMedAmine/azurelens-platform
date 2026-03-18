const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { NetworkManagementClient } = require('@azure/arm-network');

const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

function getCredential() {
  return new DefaultAzureCredential();
}

async function getVirtualMachines() {
  const credential = getCredential();
  const client = new ComputeManagementClient(credential, SUBSCRIPTION_ID);
  const vms = [];

  for await (const vm of client.virtualMachines.listAll()) {
    const resourceGroup = vm.id.split('/')[4];
    let powerStatus = 'unknown';

    try {
      const view = await client.virtualMachines.instanceView(resourceGroup, vm.name);
      const powerState = view.statuses?.find(s => s.code?.startsWith('PowerState/'));
      powerStatus = powerState?.code?.replace('PowerState/', '') || 'unknown';
    } catch (_) {}

    vms.push({
      id:       vm.id,
      name:     vm.name,
      type:     'Virtual Machine',
      location: vm.location,
      size:     vm.hardwareProfile?.vmSize || 'unknown',
      status:   powerStatus,
    });
  }

  console.log(`  ↳ Found ${vms.length} Virtual Machines`);
  return vms;
}

async function getManagedDisks() {
  const credential = getCredential();
  const client = new ComputeManagementClient(credential, SUBSCRIPTION_ID);
  const disks = [];

  for await (const disk of client.disks.list()) {
    disks.push({
      id:       disk.id,
      name:     disk.name,
      type:     'Managed Disk',
      location: disk.location,
      size_gb:  disk.diskSizeGB || 0,
      status:   disk.managedBy ? 'attached' : 'unattached',
      attached: !!disk.managedBy,
    });
  }

  console.log(`  ↳ Found ${disks.length} Managed Disks`);
  return disks;
}

async function getPublicIPs() {
  const credential = getCredential();
  const client = new NetworkManagementClient(credential, SUBSCRIPTION_ID);
  const ips = [];

  for await (const ip of client.publicIPAddresses.listAll()) {
    ips.push({
      id:       ip.id,
      name:     ip.name,
      type:     'Public IP',
      location: ip.location,
      status:   ip.ipConfiguration ? 'associated' : 'unassociated',
      attached: !!ip.ipConfiguration,
    });
  }

  console.log(`  ↳ Found ${ips.length} Public IPs`);
  return ips;
}

function analyzeWaste(vms, disks, ips) {
  const items = [];

  // كل الـ VMs بدون استثناء
  for (const vm of vms) {
    const isIdle = vm.status === 'deallocated' || vm.status === 'stopped';
    items.push({
      ...vm,
      waste_type:   isIdle ? 'idle' : 'running',
      severity:     isIdle ? 'high' : 'low',
      idle_days:    isIdle ? 30 : 0,
      monthly_cost: estimateVMCost(vm.size),
    });
  }

  // كل الـ Disks بدون استثناء
  for (const disk of disks) {
    items.push({
      ...disk,
      waste_type:   disk.attached ? 'attached' : 'unattached',
      severity:     disk.attached ? 'low' : 'medium',
      idle_days:    0,
      monthly_cost: estimateDiskCost(disk.size_gb),
    });
  }

  // كل الـ Public IPs بدون استثناء
  for (const ip of ips) {
    items.push({
      ...ip,
      waste_type:   ip.attached ? 'associated' : 'unused_ip',
      severity:     ip.attached ? 'low' : 'low',
      idle_days:    0,
      monthly_cost: 3.65,
    });
  }

  console.log(`  ↳ Total resources: ${items.length}`);
  return items;
}

function estimateVMCost(size) {
  const prices = {
    'Standard_B1s':     8,
    'Standard_B2s':    35,
    'Standard_B4ms':   75,
    'Standard_D2s_v3': 70,
    'Standard_D4s_v3': 140,
    'Standard_D8s_v3': 280,
    'Standard_D16s_v3':560,
    'Standard_F2s_v2': 62,
    'Standard_F4s_v2': 125,
    'Standard_F8s_v2': 250,
    'Standard_E2s_v3': 97,
    'Standard_E4s_v3': 194,
  };
  return prices[size] || 100;
}

function estimateDiskCost(sizeGB) {
  return Math.round((sizeGB || 128) * 0.17);
}

module.exports = {
  getVirtualMachines,
  getManagedDisks,
  getPublicIPs,
  analyzeWaste,
};