// services/aks.js — الاتصال بـ Azure AKS API
const { DefaultAzureCredential } = require('@azure/identity');
const { ContainerServiceClient } = require('@azure/arm-containerservice');

const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

function getCredential() {
  return new DefaultAzureCredential();
}

async function getAKSClusters() {
  const credential = getCredential();
  const client     = new ContainerServiceClient(credential, SUBSCRIPTION_ID);
  const clusters   = [];

  for await (const cluster of client.managedClusters.list()) {
    const resourceGroup = cluster.id.split('/')[4];
    const nodePools     = [];

    try {
      for await (const pool of client.agentPools.list(resourceGroup, cluster.name)) {
        nodePools.push({
          name:       pool.name,
          count:      pool.count || 0,
          vmSize:     pool.vmSize || 'unknown',
          mode:       pool.mode || 'User',
          powerState: pool.powerState?.code || 'Running',
          osType:     pool.osType || 'Linux',
        });
      }
    } catch (_) {}

    clusters.push({
      id:                cluster.id,
      name:              cluster.name,
      location:          cluster.location,
      resourceGroup,
      provisioningState: cluster.provisioningState,
      kubernetesVersion: cluster.kubernetesVersion,
      nodeCount:         nodePools.reduce((s, p) => s + p.count, 0),
      nodePools,
      powerState:        cluster.powerState?.code || 'Running',
    });
  }

  console.log(`  ↳ Found ${clusters.length} AKS Clusters`);
  return clusters;
}

function analyzeAKSWaste(clusters) {
  const recommendations = [];

  for (const cluster of clusters) {
    if (cluster.powerState === 'Stopped') {
      recommendations.push({
        clusterId:   cluster.id,
        clusterName: cluster.name,
        type:        'idle_cluster',
        severity:    'high',
        title:       `Cluster "${cluster.name}" is stopped`,
        description: 'Stopped cluster still incurring costs for node VMs',
        action:      'Delete or deallocate if not needed',
        monthlyCost: estimateClusterCost(cluster),
      });
    }

    for (const pool of cluster.nodePools) {
      if (pool.powerState === 'Stopped') {
        recommendations.push({
          clusterId:   cluster.id,
          clusterName: cluster.name,
          type:        'idle_nodepool',
          severity:    'high',
          title:       `Node pool "${pool.name}" is stopped`,
          description: `Pool has ${pool.count} nodes but is not running`,
          action:      'Remove idle node pool',
          monthlyCost: estimateNodePoolCost(pool),
        });
      }

      if (pool.mode === 'User' && pool.count > 3) {
        recommendations.push({
          clusterId:   cluster.id,
          clusterName: cluster.name,
          type:        'overprovisioned',
          severity:    'medium',
          title:       `Node pool "${pool.name}" may be overprovisioned`,
          description: `Running ${pool.count} nodes — consider reducing`,
          action:      `Reduce from ${pool.count} to ${Math.ceil(pool.count / 2)} nodes`,
          monthlyCost: estimateNodePoolCost(pool) / 2,
        });
      }

      if (pool.mode === 'System' && pool.count === 1) {
        recommendations.push({
          clusterId:   cluster.id,
          clusterName: cluster.name,
          type:        'single_node',
          severity:    'low',
          title:       `System pool "${pool.name}" has single node`,
          description: 'Single node has no redundancy',
          action:      'Add a second node for reliability',
          monthlyCost: 0,
        });
      }
    }
  }

  return recommendations;
}

function calculateAKSScore(clusters, recommendations) {
  if (clusters.length === 0) return { total: 100, efficiency: 100, utilization: 100, rightsizing: 100 };
  const highCount   = recommendations.filter(r => r.severity === 'high').length;
  const medCount    = recommendations.filter(r => r.severity === 'medium').length;
  const penalty     = (highCount * 15) + (medCount * 8);
  const total       = Math.max(10, 100 - penalty);
  return {
    total,
    efficiency:  Math.max(10, 100 - highCount * 20),
    utilization: Math.max(10, 100 - medCount * 15),
    rightsizing: Math.min(100, total + 5),
  };
}

function estimateNodePoolCost(pool) {
  const prices = {
    'Standard_D2s_v3': 70,  'Standard_D4s_v3': 140,
    'Standard_D8s_v3': 280, 'Standard_B2s':     35,
    'Standard_B4ms':   75,  'Standard_DS2_v2':  70,
    'Standard_DS3_v2': 140,
  };
  return (prices[pool.vmSize] || 80) * pool.count;
}

function estimateClusterCost(cluster) {
  return cluster.nodePools.reduce((s, p) => s + estimateNodePoolCost(p), 0);
}

module.exports = { getAKSClusters, analyzeAKSWaste, calculateAKSScore, estimateClusterCost };
