# Notes for [hyperledger-fabric-on-kubernetes-complete-guide](https://www.udemy.com/course/hyperledger-fabric-on-kubernetes-complete-guide)

## Steps

### Install Kubernetes

- Installed [ASDF](https://asdf-vm.com/#/core-manage-asdf)
- Activated and installed [ASDF Kubectl plugin](https://github.com/asdf-community/asdf-kubectl)

### Install [Kubernetes IDE](https://k8slens.dev)

### Install Minikube

- `asdf plugin add minikube`
- `asdf install minikube latest`
- `asdf global minikube latest`

> This will create a default and local kubernetes cluster

### Setting NFS (Network File Systems)

#### Install on Ubuntu / Debian

`sudo apt-get install nfs-kernel-server`

#### Install on Fedora

`sudo dnf install nfs-utils`

### Activate the nfs server service

`sudo systemctl enable --now nfs-server`

### Create the NFS directory

- [Fedora](https://linuxconfig.org/how-to-configure-nfs-on-linux)

`sudo mkdir -p /mnt/hf_nfs_share`

`sudo chown -R $USER:$USER /mnt/hf_nfs_share`

`sudo chmod 777 /mnt/hf_nfs_share`

`sudo nano /etc/hf_nfs_share`

> Paste below

```bash
/mnt/hf_nfs_share *(rw,sync,no_subtree_check,insecure)
```

`sudo exportfs -arv`

### Restart on Ubuntu

`sudo systemctl restart nfs-kernel-server`

### Restart on Fedora

`sudo systemctl restart nfs-server`

## Mount NFS Drive on Local system

- <https://www.digitalocean.com/community/tutorials/how-to-set-up-an-nfs-mount-on-ubuntu-20-04-pt>

-

### Create Local Client NFS

`mkdir hf_nfs_client`

### Mount the NFS on local directory

- Ubuntu: `sudo mount -o nolocks -t nfs 192.168.0.17:/mnt/nfs-server ./hf_nfs_client`
- Fedora: `sudo mount -o nolock -t nfs 192.168.0.17:/mnt/hf_nfs_share  ./hf_nfs_client`

> Change the IP to your own

### Check nodes running

`kubectl get nodes`

### Create the persistent volume for kubernetes using the NFS filesystem

> A [PersistentVolume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#introduction) (PV) is a piece of storage in the cluster that has been provisioned by an administrator or dynamically provisioned using Storage Classes. It is a resource in the cluster just like a node is a cluster resource. PVs are volume plugins like Volumes, but have a lifecycle independent of any individual Pod that uses the PV. This API object captures the details of the implementation of the storage, be that NFS, iSCSI, or a cloud-provider-specific storage system.

```bash
> kubectl apply -f hf-on-k8s-course/1.nfs-config/pv.yaml
persistentvolume/hf-on-k8s-course created

> kubectl describe pv hf-on-k8s-course
Name:            hf-on-k8s-course
Labels:          <none>
Annotations:     pv.kubernetes.io/bound-by-controller: yes
Finalizers:      [kubernetes.io/pv-protection]
StorageClass:    standard
Status:          Bound
Claim:           default/hf-on-k8s-course
Reclaim Policy:  Retain
Access Modes:    RWO
VolumeMode:      Filesystem
Capacity:        5Gi
Node Affinity:   <none>
Message:         
Source:
    Type:      NFS (an NFS mount that lasts the lifetime of a pod)
    Server:    192.168.0.17
    Path:      /mnt/hf_nfs_share/
    ReadOnly:  false
Events:        <none>
```

### Apply PersistentVolumeClaim

> A PersistentVolumeClaim (PVC) is a request for storage by a user. It is similar to a Pod. Pods consume node resources and PVCs consume PV resources. Pods can request specific levels of resources (CPU and Memory). Claims can request specific size and access modes (e.g., they can be mounted ReadWriteOnce, ReadOnlyMany or ReadWriteMany, see AccessModes).
>
> While PersistentVolumeClaims allow a user to consume abstract storage resources, it is common that users need PersistentVolumes with varying properties, such as performance, for different problems. Cluster administrators need to be able to offer a variety of PersistentVolumes that differ in more ways than size and access modes, without exposing users to the details of how those volumes are implemented. For these needs, there is the StorageClass resource.

```bash
>kubectl apply -f hf-on-k8s-course/1.nfs-config/pvc.yaml
persistentvolumeclaim/hf-on-k8s-course created

> kubectl describe pvc hf-on-k8s-courseName:          hf-on-k8s-course
Namespace:     default
StorageClass:  standard
Status:        Bound
Volume:        hf-on-k8s-course
Labels:        <none>
Annotations:   pv.kubernetes.io/bind-completed: yes
               pv.kubernetes.io/bound-by-controller: yes
Finalizers:    [kubernetes.io/pvc-protection]
Capacity:      5Gi
Access Modes:  RWO
VolumeMode:    Filesystem
Used By:       <none>
Events:        <none>
```

## Pod workload configuration

```bash
> kubectl apply -f hf-on-k8s-course/1.nfs-config/pod.yaml 
pod/hf-on-k8s-course-pv-pod created

> kubectl describe pod hf-on-k8s-course-pv-podName:         hf-on-k8s-course-pv-pod
Namespace:    default
Priority:     0
Node:         minikube/192.168.49.2
Start Time:   Tue, 23 Nov 2021 20:53:09 -0300
Labels:       app=hf-on-k8s-course-pv
Annotations:  <none>
Status:       Running
IP:           172.17.0.3
IPs:
  IP:  172.17.0.3
Containers:
  hf-on-k8s-course-pv-container:
    Container ID:   docker://18ab92515123d036a5c525ff2b7fb444d2fe7df39677a459b95f459b2fad46d0
    Image:          nginx
    Image ID:       docker-pullable://nginx@sha256:097c3a0913d7e3a5b01b6c685a60c03632fc7a2b50bc8e35bcaa3691d788226e
    Port:           80/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Tue, 23 Nov 2021 20:53:17 -0300
    Ready:          True
    Restart Count:  0
    Limits:
      cpu:     500m
      memory:  128Mi
    Requests:
      cpu:        250m
      memory:     64Mi
    Environment:  <none>
    Mounts:
      /usr/share/nginx/html/ from hf-on-k8s-course-volume (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-w7k8f (ro)
Conditions:
  Type              Status
  Initialized       True 
  Ready             True 
  ContainersReady   True 
  PodScheduled      True 
Volumes:
  hf-on-k8s-course-volume:
    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)
    ClaimName:  hf-on-k8s-course
    ReadOnly:   false
  kube-api-access-w7k8f:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   Burstable
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  96s   default-scheduler  Successfully assigned default/hf-on-k8s-course-pv-pod to minikube
  Normal  Pulling    96s   kubelet            Pulling image "nginx"
  Normal  Pulled     88s   kubelet            Successfully pulled image "nginx" in 7.376034475s
  Normal  Created    88s   kubelet            Created container hf-on-k8s-course-pv-container
  Normal  Started    88s   kubelet            Started container hf-on-k8s-course-pv-container
```

> It's possible to verify if the configuration worked using the LENS Ide by entering on cluster (eg: minikube) > workloads > pods
> Select the shell option and execute `cd /usr/share/nginx/html`
> Paste some file on your local mounted `hf_nfs_client` and on the pod's shell verifiy if the file exists using `ls` command

## Run example nginx pod

`kubectl apply -f https://k8s.io/examples/application/deployment.yaml`

> This will run a nginx server similar to below based on official run a [stateless application using a deployment sample](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2 # tells deployment to run 2 pods matching the template
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

```bash
> kubectl describe deployment nginx-deployment
Name:                   nginx-deployment
Namespace:              default
CreationTimestamp:      Fri, 03 Dec 2021 16:43:47 -0300
Labels:                 <none>
Annotations:            deployment.kubernetes.io/revision: 1
Selector:               app=nginx
Replicas:               2 desired | 2 updated | 2 total | 2 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  app=nginx
  Containers:
   nginx:
    Image:        nginx:1.14.2
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:       <none>
  Volumes:        <none>
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  <none>
NewReplicaSet:   nginx-deployment-66b6c48dd5 (2/2 replicas created)
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  11m   deployment-controller  Scaled up replica set nginx-deployment-66b6c48dd5 to 2
```

```bash
> kubectl delete deployment nginx-deployment
deployment.apps "nginx-deployment" deleted
```

## Copying the pre requisite scripts to nfs folder

`cp -R hlf-kubernetes/prerequsite/* hf_nfs_client`

## Remove permissions

`sudo chmod -x /mnt/hf_nfs_share/scripts -R`

## Configuring `Organizations FabricCA`

`mkdir -p ./hf_nfs_client/organizations`
`cp -r ./hf_nfs_client/fabric-ca ./hf_nfs_client/organizations`

> This will prepare the base configuration for each organization.
> Note that the volumeMounts should match the `subPath` on deployment yaml, also, the `persistentVolumeClaim.claimName`

### Generate the Fabric CA Deployment Yaml

> Change the content with <content> with the desired value

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <ca-org#>
spec:
  selector:
    matchLabels:
      app: <ca-org#>
  replicas: 1
  template:
    metadata:
      labels:
        app: <ca-org#>
    spec:
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: <persistent volume claim name>
      containers:
        - name: <ca-org#>
          image: hyperledger/fabric-ca:1.5.2
          imagePullPolicy: 'Always'
          command:
            [
              'fabric-ca-server',
              'start',
              '-b',
              '<fabric_ca_registrar_id>:<fabric_ca_registrar_password>',
              '--port',
              '<fabric_ca_port>',
              '-d',
            ]
          resources:
            requests:
              memory: '300Mi'
              cpu: '250m'
            limits:
              memory: '400Mi'
              cpu: '350m'
          env:
            - name: FABRIC_CA_SERVER_CA_NAME
              value: <ca-org#>
            - name: FABRIC_CA_SERVER_TLS_ENABLED
              value: 'true'
            - name: FABRIC_CA_SERVER_CSR_CN
              value: '<ca-org#>'
            - name: FABRIC_CA_SERVER_CSR_HOSTS
              value: '<ca-org#>'
          volumeMounts:
            - name: data
              mountPath: /etc/hyperledger/fabric-ca-server
              subPath: organizations/fabric-ca/<ca-org#>
```

### Generate the Fabric CA Service Yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <ca-org#>
  labels:
    app: <ca-org#>
spec:
  type: ClusterIP
  selector:
    app: <ca-org#>
  ports:
    - protocol: TCP
      targetPort: <fabric_ca_port>
      port: <fabric_ca_port>
```

## Deploy the FabricCA

### Update the permissions for <NFS_DIR>/organizations

`sudo chmod 777 /mnt/hf_nfs_share/organizations -R`

> Without this, the deployment and the server will not run properly

### Apply the deployment

```bash
> kubectl apply -f ./hf-on-k8s-course/2.ca-config/org1/ca-org1.yaml 
deployment.apps/ca-org1 created
```

### Apply the service to the deployment applied

```bash
> kubectl apply -f ./hf-on-k8s-course/2.ca-config/org1/ca-org1-service.yaml 
service/ca-org1 created
```

### Repeat the steps for Org2 FabricCA

```bash
> kubectl apply -f ./hf-on-k8s-course/2.ca-config/org2/ca-org2.yaml        
deployment.apps/ca-org2 created

> kubectl apply -f ./hf-on-k8s-course/2.ca-config/org2/ca-org2-service.yaml 
service/ca-org2 created
```

### Repeat the steps for Org3 FabricCA

```bash
> kubectl apply -f ./hf-on-k8s-course/2.ca-config/org3/ca-org3.yaml        
deployment.apps/ca-org3 created

> kubectl apply -f ./hf-on-k8s-course/2.ca-config/org3/ca-org3-service.yaml 
service/ca-org3 created
```

### Repeat the steps for Orderer Org FabricCA

```bash
> kubectl apply -f ./hf-on-k8s-course/2.ca-config/ordererOrg/ca-orderer.yaml        
deployment.apps/ca-org3 created

> kubectl apply -f ./hf-on-k8s-course/2.ca-config/ordererOrg/ca-orderer-service.yaml 
service/ca-org3 created
```

### Deploy all script FabricCA Script

`bash deploy.all.ca.sh`

### Run create-certs-job to generate the nodes certificates

`kubectl apply -f ./hf-on-k8s-course/3.node-certificates-generation/create-certs-job.yaml`

### Run channel-configuration-job to generate the channel configuration artifacts

```bash
> kubectl apply -f ./hf-on-k8s-course/4.channel-configuration-artifacts/channel-configuration-job.yaml 
job.batch/artifacts created
```

## Deploy orderers

### orderer.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer1        
service/orderer created
deployment.apps/orderer created
```

### orderer2.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer2        
service/orderer created
deployment.apps/orderer created
```

### orderer3.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer3        
service/orderer created
deployment.apps/orderer created
```

### orderer4.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer4
service/orderer created
deployment.apps/orderer created
```

### orderer5.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer5
service/orderer created
deployment.apps/orderer created
```

## Apply Config map for external chaincode builders

```bash
> kubectl apply -f ./hf-on-k8s-course/6.configmap                                            
configmap/builders-config created
```

## Deploy Peers

### Peer0 Org1

`kubectl apply -f ./hf-on-k8s-course/7.peers/org1`

### Peer0 Org2

`kubectl apply -f ./hf-on-k8s-course/7.peers/org2`

### Peer0 Org3

`kubectl apply -f ./hf-on-k8s-course/7.peers/org3`

## Create the application channel block

```bash
> kubectl exec -it -f ./hf-on-k8s-course/7.peers/org1/peer0Org1-cli.yaml -- bash /scripts/createAppChannel.sh
2021-12-03 23:46:20.964 UTC 0001 DEBU [bccsp] GetDefault -> Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
2021-12-03 23:46:20.965 UTC 0002 DEBU [bccsp] GetDefault -> Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
2021-12-03 23:46:21.056 UTC 0003 DEBU [bccsp] GetDefault -> Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
2021-12-03 23:46:21.058 UTC 0004 DEBU [bccsp_sw] openKeyStore -> KeyStore opened at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore]...done
2021-12-03 23:46:21.059 UTC 0005 DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts
2021-12-03 23:46:21.059 UTC 0006 DEBU [msp] getPemMaterialFromDir -> Inspecting file /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem
2021-12-03 23:46:21.059 UTC 0007 DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/cacerts
2021-12-03 23:46:21.060 UTC 0008 DEBU [msp] getPemMaterialFromDir -> Inspecting file /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/cacerts/ca-org1-7054-ca-org1.pem
2021-12-03 23:46:21.060 UTC 0009 DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/admincerts
2021-12-03 23:46:21.060 UTC 000a DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/intermediatecerts
2021-12-03 23:46:21.060 UTC 000b DEBU [msp] getMspConfig -> Intermediate certs folder not found at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/intermediatecerts]. Skipping. [stat /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/intermediatecerts: no such file or directory]
2021-12-03 23:46:21.060 UTC 000c DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/tlscacerts
2021-12-03 23:46:21.061 UTC 000d DEBU [msp] getMspConfig -> TLS CA certs folder not found at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/tlsintermediatecerts]. Skipping and ignoring TLS intermediate CA folder. [stat /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/tlscacerts: no such file or directory]
2021-12-03 23:46:21.061 UTC 000e DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/crls
2021-12-03 23:46:21.061 UTC 000f DEBU [msp] getMspConfig -> crls folder not found at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/crls]. Skipping. [stat /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/crls: no such file or directory]
2021-12-03 23:46:21.061 UTC 0010 DEBU [msp] getMspConfig -> Loading NodeOUs
2021-12-03 23:46:21.061 UTC 0011 DEBU [msp] newBccspMsp -> Creating BCCSP-based MSP instance
2021-12-03 23:46:21.061 UTC 0012 DEBU [msp] New -> Creating Cache-MSP instance
2021-12-03 23:46:21.062 UTC 0013 DEBU [msp] loadLocalMSP -> Created new local MSP
2021-12-03 23:46:21.062 UTC 0014 DEBU [msp] Setup -> Setting up MSP instance Org1MSP
2021-12-03 23:46:21.062 UTC 0015 DEBU [msp.identity] newIdentity -> Creating identity instance for cert -----BEGIN CERTIFICATE-----
MIICGTCCAb+gAwIBAgIUH0qSJ2aM7yPVLuXYwFtxqYxzu/0wCgYIKoZIzj0EAwIw
aTELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg
WW9yazEQMA4GA1UEChMHY2Etb3JnMTEQMA4GA1UECxMHY2Etb3JnMTEQMA4GA1UE
AxMHY2Etb3JnMTAeFw0yMTEyMDMyMTAwMDBaFw0zNjExMjkyMTAwMDBaMGkxCzAJ
BgNVBAYTAlVTMREwDwYDVQQIEwhOZXcgWW9yazERMA8GA1UEBxMITmV3IFlvcmsx
EDAOBgNVBAoTB2NhLW9yZzExEDAOBgNVBAsTB2NhLW9yZzExEDAOBgNVBAMTB2Nh
LW9yZzEwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASX7N8zRuMq41Y5qQ/Vhlv+
b7HstF0eMGjb81UXOVVaerhpXAWvXJ0T/VLRKiMyJJELmmA8zQToH3GeNM+XX1w2
o0UwQzAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBATAdBgNVHQ4E
FgQUqdxhc8mskIJ6z/gq0z48RV/PgyQwCgYIKoZIzj0EAwIDSAAwRQIhALvE5B8D
t84thZYtWF0I6aPlUiBnPmk2l7s5vO9I3BcWAiBVQVnvrDTb4J4ApQ4sJWhOKqhx
6PpT24exkTXHzRcM3w==
-----END CERTIFICATE-----
2021-12-03 23:46:21.062 UTC 0016 DEBU [msp.identity] newIdentity -> Creating identity instance for cert -----BEGIN CERTIFICATE-----
MIICrDCCAlKgAwIBAgIUZYLJda2tjiSS1v+/5Eub8GJGjiowCgYIKoZIzj0EAwIw
aTELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg
WW9yazEQMA4GA1UEChMHY2Etb3JnMTEQMA4GA1UECxMHY2Etb3JnMTEQMA4GA1UE
AxMHY2Etb3JnMTAeFw0yMTEyMDMyMTAwMDBaFw0yMjEyMDMyMTU2MDBaMGAxCzAJ
BgNVBAYTAlVTMRcwFQYDVQQIEw5Ob3J0aCBDYXJvbGluYTEUMBIGA1UEChMLSHlw
ZXJsZWRnZXIxDjAMBgNVBAsTBWFkbWluMRIwEAYDVQQDEwlvcmcxYWRtaW4wWTAT
BgcqhkjOPQIBBggqhkjOPQMBBwNCAARmIymL9IYFPne70hCIE+Rg7ON0o57IQtFM
y8Dy4wlcE5upPI17rBHbtD5e+2AquPee1oa0T+ZfuUmxlb166zYao4HgMIHdMA4G
A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBT74XWffKT9H4VX
QNGOL/GEZ8cebjAfBgNVHSMEGDAWgBSp3GFzyayQgnrP+CrTPjxFX8+DJDAgBgNV
HREEGTAXghVjcmVhdGUtY2VydHMtLTEtY2s4YnIwWwYIKgMEBQYHCAEET3siYXR0
cnMiOnsiaGYuQWZmaWxpYXRpb24iOiIiLCJoZi5FbnJvbGxtZW50SUQiOiJvcmcx
YWRtaW4iLCJoZi5UeXBlIjoiYWRtaW4ifX0wCgYIKoZIzj0EAwIDSAAwRQIhANY+
jhmfSXoVgaV49ZtJvMz3UME1WxxF3UsG4aq4pO9kAiA6EJqKsrIZpjNiFKIBpnlr
m69fAKnaK7j6eBSecSNV5Q==
-----END CERTIFICATE-----
2021-12-03 23:46:21.062 UTC 0017 DEBU [bccsp_sw] loadPrivateKey -> Loading private key [8fa3d970df0b3ecd5560e1d0f4fbf2246a234e02beec93cb7a1694ad560f7a38] at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/8fa3d970df0b3ecd5560e1d0f4fbf2246a234e02beec93cb7a1694ad560f7a38_sk]...
2021-12-03 23:46:21.063 UTC 0018 DEBU [msp.identity] newIdentity -> Creating identity instance for cert -----BEGIN CERTIFICATE-----
MIICrDCCAlKgAwIBAgIUZYLJda2tjiSS1v+/5Eub8GJGjiowCgYIKoZIzj0EAwIw
aTELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg
WW9yazEQMA4GA1UEChMHY2Etb3JnMTEQMA4GA1UECxMHY2Etb3JnMTEQMA4GA1UE
AxMHY2Etb3JnMTAeFw0yMTEyMDMyMTAwMDBaFw0yMjEyMDMyMTU2MDBaMGAxCzAJ
BgNVBAYTAlVTMRcwFQYDVQQIEw5Ob3J0aCBDYXJvbGluYTEUMBIGA1UEChMLSHlw
ZXJsZWRnZXIxDjAMBgNVBAsTBWFkbWluMRIwEAYDVQQDEwlvcmcxYWRtaW4wWTAT
BgcqhkjOPQIBBggqhkjOPQMBBwNCAARmIymL9IYFPne70hCIE+Rg7ON0o57IQtFM
y8Dy4wlcE5upPI17rBHbtD5e+2AquPee1oa0T+ZfuUmxlb166zYao4HgMIHdMA4G
A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBT74XWffKT9H4VX
QNGOL/GEZ8cebjAfBgNVHSMEGDAWgBSp3GFzyayQgnrP+CrTPjxFX8+DJDAgBgNV
HREEGTAXghVjcmVhdGUtY2VydHMtLTEtY2s4YnIwWwYIKgMEBQYHCAEET3siYXR0
cnMiOnsiaGYuQWZmaWxpYXRpb24iOiIiLCJoZi5FbnJvbGxtZW50SUQiOiJvcmcx
YWRtaW4iLCJoZi5UeXBlIjoiYWRtaW4ifX0wCgYIKoZIzj0EAwIDSAAwRQIhANY+
jhmfSXoVgaV49ZtJvMz3UME1WxxF3UsG4aq4pO9kAiA6EJqKsrIZpjNiFKIBpnlr
m69fAKnaK7j6eBSecSNV5Q==
-----END CERTIFICATE-----
2021-12-03 23:46:21.063 UTC 0019 DEBU [msp] setupSigningIdentity -> Signing identity expires at 2022-12-03 21:56:00 +0000 UTC
2021-12-03 23:46:21.063 UTC 001a DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:46:21.064 UTC [grpc] WarningDepth -> DEBU 001 [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 002 [core]parsed scheme: ""
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 003 [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 004 [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 005 [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 006 [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 007 [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 008 [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 009 [core]pickfirstBalancer: UpdateSubConnState: 0xc00033b660, {CONNECTING <nil>}
2021-12-03 23:46:21.064 UTC [grpc] InfoDepth -> DEBU 00a [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:21.066 UTC 001b DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 779.232µs remoteaddress=10.97.71.223:7050
2021-12-03 23:46:21.066 UTC [grpc] InfoDepth -> DEBU 00b [core]Subchannel Connectivity change to READY
2021-12-03 23:46:21.066 UTC [grpc] InfoDepth -> DEBU 00c [core]pickfirstBalancer: UpdateSubConnState: 0xc00033b660, {READY <nil>}
2021-12-03 23:46:21.066 UTC [grpc] InfoDepth -> DEBU 00d [core]Channel Connectivity change to READY
2021-12-03 23:46:21.066 UTC 001c INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:46:21.067 UTC 001d DEBU [msp.identity] Sign -> Sign: plaintext: 0AE9070A074F7267314D535012DD072D...53616D706C65436F6E736F727469756D 
2021-12-03 23:46:21.067 UTC 001e DEBU [msp.identity] Sign -> Sign: digest: 9B2637D4CB7C3D732603BDB0DEA68F65854673085A0111B2830446C0410431AF 
2021-12-03 23:46:21.067 UTC 001f DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508021A0608CDD8AA8D0622...6E78D15CC5E00B211CFEE621C6EE6F77 
2021-12-03 23:46:21.067 UTC 0020 DEBU [msp.identity] Sign -> Sign: digest: E2BBBCBE7085A5732819AA87A6312425AF2EE783D5017E71A34ACDA4DF327796 
2021-12-03 23:46:21.150 UTC [grpc] WarningDepth -> DEBU 00e [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 00f [core]parsed scheme: ""
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 010 [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 011 [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 012 [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 013 [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 014 [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 015 [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 016 [core]pickfirstBalancer: UpdateSubConnState: 0xc0004b7b30, {CONNECTING <nil>}
2021-12-03 23:46:21.151 UTC [grpc] InfoDepth -> DEBU 017 [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:21.152 UTC 0021 DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 1.055248ms remoteaddress=10.97.71.223:7050
2021-12-03 23:46:21.152 UTC [grpc] InfoDepth -> DEBU 018 [core]Subchannel Connectivity change to READY
2021-12-03 23:46:21.152 UTC [grpc] InfoDepth -> DEBU 019 [core]pickfirstBalancer: UpdateSubConnState: 0xc0004b7b30, {READY <nil>}
2021-12-03 23:46:21.152 UTC [grpc] InfoDepth -> DEBU 01a [core]Channel Connectivity change to READY
2021-12-03 23:46:21.161 UTC 0022 DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508051A0608CDD8AA8D0622...520B539D5A2E12080A021A0012021A00 
2021-12-03 23:46:21.161 UTC 0023 DEBU [msp.identity] Sign -> Sign: digest: 22BC88022FDCACFF25D3D1742284A110712C6A42EE18F80B182575A0A48E3FF3 
2021-12-03 23:46:21.161 UTC 0024 INFO [cli.common] readBlock -> Expect block, but got status: &{NOT_FOUND}
2021-12-03 23:46:21.161 UTC 0025 DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:46:21.161 UTC [grpc] WarningDepth -> DEBU 01b [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:21.161 UTC [grpc] InfoDepth -> DEBU 01c [core]parsed scheme: ""
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 01d [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 01e [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 01f [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 020 [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 021 [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 022 [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 023 [core]pickfirstBalancer: UpdateSubConnState: 0xc00063a660, {CONNECTING <nil>}
2021-12-03 23:46:21.162 UTC [grpc] InfoDepth -> DEBU 024 [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:21.163 UTC 0026 DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 913.496µs remoteaddress=10.97.71.223:7050
2021-12-03 23:46:21.163 UTC [grpc] InfoDepth -> DEBU 025 [core]Subchannel Connectivity change to READY
2021-12-03 23:46:21.163 UTC [grpc] InfoDepth -> DEBU 026 [core]pickfirstBalancer: UpdateSubConnState: 0xc00063a660, {READY <nil>}
2021-12-03 23:46:21.163 UTC [grpc] InfoDepth -> DEBU 027 [core]Channel Connectivity change to READY
2021-12-03 23:46:21.163 UTC 0027 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:46:21.364 UTC 0028 DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508051A0608CDD8AA8D0622...C8D6C501D03412080A021A0012021A00 
2021-12-03 23:46:21.364 UTC 0029 DEBU [msp.identity] Sign -> Sign: digest: 3ED588ABD08B6CA5F69C23B9A8AC44F18F57189F5F03B899BC2BFC40FE806C11 
2021-12-03 23:46:21.365 UTC 002a INFO [cli.common] readBlock -> Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-12-03 23:46:21.365 UTC 002b DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:46:21.365 UTC [grpc] WarningDepth -> DEBU 028 [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 029 [core]parsed scheme: ""
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 02a [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 02b [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 02c [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 02d [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 02e [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 02f [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 030 [core]pickfirstBalancer: UpdateSubConnState: 0xc000469260, {CONNECTING <nil>}
2021-12-03 23:46:21.365 UTC [grpc] InfoDepth -> DEBU 031 [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:21.367 UTC 002c DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 902.642µs remoteaddress=10.97.71.223:7050
2021-12-03 23:46:21.367 UTC [grpc] InfoDepth -> DEBU 032 [core]Subchannel Connectivity change to READY
2021-12-03 23:46:21.367 UTC [grpc] InfoDepth -> DEBU 033 [core]pickfirstBalancer: UpdateSubConnState: 0xc000469260, {READY <nil>}
2021-12-03 23:46:21.367 UTC [grpc] InfoDepth -> DEBU 034 [core]Channel Connectivity change to READY
2021-12-03 23:46:21.367 UTC 002d INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:46:21.567 UTC 002e DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508051A0608CDD8AA8D0622...2DB92BFA507C12080A021A0012021A00 
2021-12-03 23:46:21.567 UTC 002f DEBU [msp.identity] Sign -> Sign: digest: F8E6DD93E25729AA834D088EDBB7C798CB19E4ACE05B53BC4765B1676E9F903E 
2021-12-03 23:46:21.568 UTC 0030 INFO [cli.common] readBlock -> Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-12-03 23:46:21.568 UTC 0031 DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:46:21.568 UTC [grpc] WarningDepth -> DEBU 035 [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 036 [core]parsed scheme: ""
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 037 [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 038 [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 039 [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 03a [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 03b [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 03c [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 03d [core]pickfirstBalancer: UpdateSubConnState: 0xc000469ff0, {CONNECTING <nil>}
2021-12-03 23:46:21.568 UTC [grpc] InfoDepth -> DEBU 03e [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:21.569 UTC 0032 DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 858.544µs remoteaddress=10.97.71.223:7050
2021-12-03 23:46:21.570 UTC [grpc] InfoDepth -> DEBU 03f [core]Subchannel Connectivity change to READY
2021-12-03 23:46:21.570 UTC [grpc] InfoDepth -> DEBU 040 [core]pickfirstBalancer: UpdateSubConnState: 0xc000469ff0, {READY <nil>}
2021-12-03 23:46:21.570 UTC [grpc] InfoDepth -> DEBU 041 [core]Channel Connectivity change to READY
2021-12-03 23:46:21.570 UTC 0033 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:46:21.770 UTC 0034 DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508051A0608CDD8AA8D0622...8D28C947B95C12080A021A0012021A00 
2021-12-03 23:46:21.770 UTC 0035 DEBU [msp.identity] Sign -> Sign: digest: 21A95656053A41CCA6C8D3A70790D0BC83EA88756E26995F3AA0945D092BE5EF 
2021-12-03 23:46:21.771 UTC 0036 INFO [cli.common] readBlock -> Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-12-03 23:46:21.771 UTC 0037 DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:46:21.771 UTC [grpc] WarningDepth -> DEBU 042 [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:21.771 UTC [grpc] InfoDepth -> DEBU 043 [core]parsed scheme: ""
2021-12-03 23:46:21.771 UTC [grpc] InfoDepth -> DEBU 044 [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:21.771 UTC [grpc] InfoDepth -> DEBU 045 [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:21.771 UTC [grpc] InfoDepth -> DEBU 046 [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:21.771 UTC [grpc] InfoDepth -> DEBU 047 [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:21.772 UTC [grpc] InfoDepth -> DEBU 048 [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:21.772 UTC [grpc] InfoDepth -> DEBU 049 [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:21.772 UTC [grpc] InfoDepth -> DEBU 04a [core]pickfirstBalancer: UpdateSubConnState: 0xc0004b7710, {CONNECTING <nil>}
2021-12-03 23:46:21.772 UTC [grpc] InfoDepth -> DEBU 04b [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:21.773 UTC 0038 DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 709.702µs remoteaddress=10.97.71.223:7050
2021-12-03 23:46:21.773 UTC [grpc] InfoDepth -> DEBU 04c [core]Subchannel Connectivity change to READY
2021-12-03 23:46:21.773 UTC [grpc] InfoDepth -> DEBU 04d [core]pickfirstBalancer: UpdateSubConnState: 0xc0004b7710, {READY <nil>}
2021-12-03 23:46:21.773 UTC [grpc] InfoDepth -> DEBU 04e [core]Channel Connectivity change to READY
2021-12-03 23:46:21.773 UTC 0039 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:46:21.974 UTC 003a DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508051A0608CDD8AA8D0622...78F9249FCA3112080A021A0012021A00 
2021-12-03 23:46:21.974 UTC 003b DEBU [msp.identity] Sign -> Sign: digest: 0F74B3E30DD9CD561A87005D226798330A8D4A6C0044F9F2391D0A2A437AC99B 
2021-12-03 23:46:21.974 UTC 003c INFO [cli.common] readBlock -> Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-12-03 23:46:21.974 UTC 003d DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:46:21.975 UTC [grpc] WarningDepth -> DEBU 04f [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 050 [core]parsed scheme: ""
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 051 [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 052 [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 053 [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 054 [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 055 [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 056 [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 057 [core]pickfirstBalancer: UpdateSubConnState: 0xc0005c7180, {CONNECTING <nil>}
2021-12-03 23:46:21.975 UTC [grpc] InfoDepth -> DEBU 058 [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:21.976 UTC 003e DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 755.66µs remoteaddress=10.97.71.223:7050
2021-12-03 23:46:21.976 UTC [grpc] InfoDepth -> DEBU 059 [core]Subchannel Connectivity change to READY
2021-12-03 23:46:21.976 UTC [grpc] InfoDepth -> DEBU 05a [core]pickfirstBalancer: UpdateSubConnState: 0xc0005c7180, {READY <nil>}
2021-12-03 23:46:21.976 UTC [grpc] InfoDepth -> DEBU 05b [core]Channel Connectivity change to READY
2021-12-03 23:46:21.976 UTC 003f INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:46:22.176 UTC 0040 DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508051A0608CED8AA8D0622...9F4CC912A25612080A021A0012021A00 
2021-12-03 23:46:22.176 UTC 0041 DEBU [msp.identity] Sign -> Sign: digest: A3FDC7CE0B3D3B1A428DB4F83D556D9373E3825295D46806182CF2D9786A7BCB 
2021-12-03 23:46:22.177 UTC 0042 INFO [cli.common] readBlock -> Expect block, but got status: &{SERVICE_UNAVAILABLE}
2021-12-03 23:46:22.177 UTC 0043 DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:46:22.177 UTC [grpc] WarningDepth -> DEBU 05c [core]Adjusting keepalive ping interval to minimum period of 10s
2021-12-03 23:46:22.177 UTC [grpc] InfoDepth -> DEBU 05d [core]parsed scheme: ""
2021-12-03 23:46:22.177 UTC [grpc] InfoDepth -> DEBU 05e [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:46:22.178 UTC [grpc] InfoDepth -> DEBU 05f [core]ccResolverWrapper: sending update to cc: {[{orderer:7050  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:46:22.178 UTC [grpc] InfoDepth -> DEBU 060 [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:46:22.178 UTC [grpc] InfoDepth -> DEBU 061 [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:46:22.178 UTC [grpc] InfoDepth -> DEBU 062 [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:46:22.178 UTC [grpc] InfoDepth -> DEBU 063 [core]Subchannel picks a new address "orderer:7050" to connect
2021-12-03 23:46:22.178 UTC [grpc] InfoDepth -> DEBU 064 [core]pickfirstBalancer: UpdateSubConnState: 0xc00063bad0, {CONNECTING <nil>}
2021-12-03 23:46:22.178 UTC [grpc] InfoDepth -> DEBU 065 [core]Channel Connectivity change to CONNECTING
2021-12-03 23:46:22.179 UTC 0044 DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 730.897µs remoteaddress=10.97.71.223:7050
2021-12-03 23:46:22.179 UTC [grpc] InfoDepth -> DEBU 066 [core]Subchannel Connectivity change to READY
2021-12-03 23:46:22.179 UTC [grpc] InfoDepth -> DEBU 067 [core]pickfirstBalancer: UpdateSubConnState: 0xc00063bad0, {READY <nil>}
2021-12-03 23:46:22.179 UTC [grpc] InfoDepth -> DEBU 068 [core]Channel Connectivity change to READY
2021-12-03 23:46:22.179 UTC 0045 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:46:22.379 UTC 0046 DEBU [msp.identity] Sign -> Sign: plaintext: 0AA0080A1508051A0608CED8AA8D0622...C5F1E0AA3C1312080A021A0012021A00 
2021-12-03 23:46:22.380 UTC 0047 DEBU [msp.identity] Sign -> Sign: digest: 6E96E992223981945E4DD8B07D3BFF82F00C95B50DD3DAAB22FCD3E102EAFE4D 
2021-12-03 23:46:22.382 UTC 0048 INFO [cli.common] readBlock -> Received block: 0
```

## Joining Peers to `mychannel`

```bash
> kubectl exec -it -f ./hf-on-k8s-course/7.peers/org1/peer0Org1-cli.yaml -- peer channel join -b ./channel-artifacts/mychannel.block

2021-12-03 23:52:07.755 UTC 0001 DEBU [bccsp] GetDefault -> Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
2021-12-03 23:52:07.756 UTC 0002 DEBU [bccsp] GetDefault -> Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
2021-12-03 23:52:07.763 UTC 0003 DEBU [bccsp] GetDefault -> Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
2021-12-03 23:52:07.765 UTC 0004 DEBU [bccsp_sw] openKeyStore -> KeyStore opened at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore]...done
2021-12-03 23:52:07.765 UTC 0005 DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts
2021-12-03 23:52:07.765 UTC 0006 DEBU [msp] getPemMaterialFromDir -> Inspecting file /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem
2021-12-03 23:52:07.766 UTC 0007 DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/cacerts
2021-12-03 23:52:07.766 UTC 0008 DEBU [msp] getPemMaterialFromDir -> Inspecting file /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/cacerts/ca-org1-7054-ca-org1.pem
2021-12-03 23:52:07.766 UTC 0009 DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/admincerts
2021-12-03 23:52:07.766 UTC 000a DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/intermediatecerts
2021-12-03 23:52:07.766 UTC 000b DEBU [msp] getMspConfig -> Intermediate certs folder not found at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/intermediatecerts]. Skipping. [stat /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/intermediatecerts: no such file or directory]
2021-12-03 23:52:07.766 UTC 000c DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/tlscacerts
2021-12-03 23:52:07.766 UTC 000d DEBU [msp] getMspConfig -> TLS CA certs folder not found at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/tlsintermediatecerts]. Skipping and ignoring TLS intermediate CA folder. [stat /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/tlscacerts: no such file or directory]
2021-12-03 23:52:07.766 UTC 000e DEBU [msp] getPemMaterialFromDir -> Reading directory /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/crls
2021-12-03 23:52:07.766 UTC 000f DEBU [msp] getMspConfig -> crls folder not found at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/crls]. Skipping. [stat /organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/crls: no such file or directory]
2021-12-03 23:52:07.766 UTC 0010 DEBU [msp] getMspConfig -> Loading NodeOUs
2021-12-03 23:52:07.766 UTC 0011 DEBU [msp] newBccspMsp -> Creating BCCSP-based MSP instance
2021-12-03 23:52:07.766 UTC 0012 DEBU [msp] New -> Creating Cache-MSP instance
2021-12-03 23:52:07.766 UTC 0013 DEBU [msp] loadLocalMSP -> Created new local MSP
2021-12-03 23:52:07.767 UTC 0014 DEBU [msp] Setup -> Setting up MSP instance Org1MSP
2021-12-03 23:52:07.767 UTC 0015 DEBU [msp.identity] newIdentity -> Creating identity instance for cert -----BEGIN CERTIFICATE-----
MIICGTCCAb+gAwIBAgIUH0qSJ2aM7yPVLuXYwFtxqYxzu/0wCgYIKoZIzj0EAwIw
aTELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg
WW9yazEQMA4GA1UEChMHY2Etb3JnMTEQMA4GA1UECxMHY2Etb3JnMTEQMA4GA1UE
AxMHY2Etb3JnMTAeFw0yMTEyMDMyMTAwMDBaFw0zNjExMjkyMTAwMDBaMGkxCzAJ
BgNVBAYTAlVTMREwDwYDVQQIEwhOZXcgWW9yazERMA8GA1UEBxMITmV3IFlvcmsx
EDAOBgNVBAoTB2NhLW9yZzExEDAOBgNVBAsTB2NhLW9yZzExEDAOBgNVBAMTB2Nh
LW9yZzEwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAASX7N8zRuMq41Y5qQ/Vhlv+
b7HstF0eMGjb81UXOVVaerhpXAWvXJ0T/VLRKiMyJJELmmA8zQToH3GeNM+XX1w2
o0UwQzAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBATAdBgNVHQ4E
FgQUqdxhc8mskIJ6z/gq0z48RV/PgyQwCgYIKoZIzj0EAwIDSAAwRQIhALvE5B8D
t84thZYtWF0I6aPlUiBnPmk2l7s5vO9I3BcWAiBVQVnvrDTb4J4ApQ4sJWhOKqhx
6PpT24exkTXHzRcM3w==
-----END CERTIFICATE-----
2021-12-03 23:52:07.767 UTC 0016 DEBU [msp.identity] newIdentity -> Creating identity instance for cert -----BEGIN CERTIFICATE-----
MIICrDCCAlKgAwIBAgIUZYLJda2tjiSS1v+/5Eub8GJGjiowCgYIKoZIzj0EAwIw
aTELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg
WW9yazEQMA4GA1UEChMHY2Etb3JnMTEQMA4GA1UECxMHY2Etb3JnMTEQMA4GA1UE
AxMHY2Etb3JnMTAeFw0yMTEyMDMyMTAwMDBaFw0yMjEyMDMyMTU2MDBaMGAxCzAJ
BgNVBAYTAlVTMRcwFQYDVQQIEw5Ob3J0aCBDYXJvbGluYTEUMBIGA1UEChMLSHlw
ZXJsZWRnZXIxDjAMBgNVBAsTBWFkbWluMRIwEAYDVQQDEwlvcmcxYWRtaW4wWTAT
BgcqhkjOPQIBBggqhkjOPQMBBwNCAARmIymL9IYFPne70hCIE+Rg7ON0o57IQtFM
y8Dy4wlcE5upPI17rBHbtD5e+2AquPee1oa0T+ZfuUmxlb166zYao4HgMIHdMA4G
A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBT74XWffKT9H4VX
QNGOL/GEZ8cebjAfBgNVHSMEGDAWgBSp3GFzyayQgnrP+CrTPjxFX8+DJDAgBgNV
HREEGTAXghVjcmVhdGUtY2VydHMtLTEtY2s4YnIwWwYIKgMEBQYHCAEET3siYXR0
cnMiOnsiaGYuQWZmaWxpYXRpb24iOiIiLCJoZi5FbnJvbGxtZW50SUQiOiJvcmcx
YWRtaW4iLCJoZi5UeXBlIjoiYWRtaW4ifX0wCgYIKoZIzj0EAwIDSAAwRQIhANY+
jhmfSXoVgaV49ZtJvMz3UME1WxxF3UsG4aq4pO9kAiA6EJqKsrIZpjNiFKIBpnlr
m69fAKnaK7j6eBSecSNV5Q==
-----END CERTIFICATE-----
2021-12-03 23:52:07.767 UTC 0017 DEBU [bccsp_sw] loadPrivateKey -> Loading private key [8fa3d970df0b3ecd5560e1d0f4fbf2246a234e02beec93cb7a1694ad560f7a38] at [/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/8fa3d970df0b3ecd5560e1d0f4fbf2246a234e02beec93cb7a1694ad560f7a38_sk]...
2021-12-03 23:52:07.767 UTC 0018 DEBU [msp.identity] newIdentity -> Creating identity instance for cert -----BEGIN CERTIFICATE-----
MIICrDCCAlKgAwIBAgIUZYLJda2tjiSS1v+/5Eub8GJGjiowCgYIKoZIzj0EAwIw
aTELMAkGA1UEBhMCVVMxETAPBgNVBAgTCE5ldyBZb3JrMREwDwYDVQQHEwhOZXcg
WW9yazEQMA4GA1UEChMHY2Etb3JnMTEQMA4GA1UECxMHY2Etb3JnMTEQMA4GA1UE
AxMHY2Etb3JnMTAeFw0yMTEyMDMyMTAwMDBaFw0yMjEyMDMyMTU2MDBaMGAxCzAJ
BgNVBAYTAlVTMRcwFQYDVQQIEw5Ob3J0aCBDYXJvbGluYTEUMBIGA1UEChMLSHlw
ZXJsZWRnZXIxDjAMBgNVBAsTBWFkbWluMRIwEAYDVQQDEwlvcmcxYWRtaW4wWTAT
BgcqhkjOPQIBBggqhkjOPQMBBwNCAARmIymL9IYFPne70hCIE+Rg7ON0o57IQtFM
y8Dy4wlcE5upPI17rBHbtD5e+2AquPee1oa0T+ZfuUmxlb166zYao4HgMIHdMA4G
A1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBT74XWffKT9H4VX
QNGOL/GEZ8cebjAfBgNVHSMEGDAWgBSp3GFzyayQgnrP+CrTPjxFX8+DJDAgBgNV
HREEGTAXghVjcmVhdGUtY2VydHMtLTEtY2s4YnIwWwYIKgMEBQYHCAEET3siYXR0
cnMiOnsiaGYuQWZmaWxpYXRpb24iOiIiLCJoZi5FbnJvbGxtZW50SUQiOiJvcmcx
YWRtaW4iLCJoZi5UeXBlIjoiYWRtaW4ifX0wCgYIKoZIzj0EAwIDSAAwRQIhANY+
jhmfSXoVgaV49ZtJvMz3UME1WxxF3UsG4aq4pO9kAiA6EJqKsrIZpjNiFKIBpnlr
m69fAKnaK7j6eBSecSNV5Q==
-----END CERTIFICATE-----
2021-12-03 23:52:07.767 UTC 0019 DEBU [msp] setupSigningIdentity -> Signing identity expires at 2022-12-03 21:56:00 +0000 UTC
2021-12-03 23:52:07.768 UTC 001a DEBU [msp] GetDefaultSigningIdentity -> Obtaining default signing identity
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 001 [core]parsed scheme: ""
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 002 [core]scheme "" not registered, fallback to default scheme
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 003 [core]ccResolverWrapper: sending update to cc: {[{peer0-org1:7051  <nil> 0 <nil>}] <nil> <nil>}
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 004 [core]ClientConn switching balancer to "pick_first"
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 005 [core]Channel switches to new LB policy "pick_first"
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 006 [core]Subchannel Connectivity change to CONNECTING
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 007 [core]Subchannel picks a new address "peer0-org1:7051" to connect
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 008 [core]pickfirstBalancer: UpdateSubConnState: 0xc00033cf90, {CONNECTING <nil>}
2021-12-03 23:52:07.769 UTC [grpc] InfoDepth -> DEBU 009 [core]Channel Connectivity change to CONNECTING
2021-12-03 23:52:07.770 UTC 001b DEBU [comm.tls] ClientHandshake -> Client TLS handshake completed in 939.635µs remoteaddress=10.101.100.170:7051
2021-12-03 23:52:07.770 UTC [grpc] InfoDepth -> DEBU 00a [core]Subchannel Connectivity change to READY
2021-12-03 23:52:07.770 UTC [grpc] InfoDepth -> DEBU 00b [core]pickfirstBalancer: UpdateSubConnState: 0xc00033cf90, {READY <nil>}
2021-12-03 23:52:07.770 UTC [grpc] InfoDepth -> DEBU 00c [core]Channel Connectivity change to READY
2021-12-03 23:52:07.770 UTC 001c INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
2021-12-03 23:52:07.771 UTC 001d DEBU [msp.identity] Sign -> Sign: plaintext: 0AE7080A5C08011A0C08A7DBAA8D0610...FE18A3E41A0A0A000A000A000A000A00 
2021-12-03 23:52:07.771 UTC 001e DEBU [msp.identity] Sign -> Sign: digest: A6BCFCE9F0A2E15786719F2BF3E4AAB1FAF6171A33CA07A1B8F1FF8F4BB17D52 
2021-12-03 23:52:08.076 UTC 001f INFO [channelCmd] executeJoin -> Successfully submitted proposal to join channel
```
