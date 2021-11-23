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
> kubectl apply -f hf-on-k8s-course/nfs-config/pv.yaml
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
>kubectl apply -f hf-on-k8s-course/nfs-config/pvc.yaml
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

``````
