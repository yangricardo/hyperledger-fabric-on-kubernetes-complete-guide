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

## orderer.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer1        
service/orderer created
deployment.apps/orderer created
```

## orderer2.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer2        
service/orderer created
deployment.apps/orderer created
```

## orderer3.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer3        
service/orderer created
deployment.apps/orderer created
```

## orderer4.example.com

```bash
> kubectl apply -f ./hf-on-k8s-course/5.orderer/orderer4
service/orderer created
deployment.apps/orderer created
```
