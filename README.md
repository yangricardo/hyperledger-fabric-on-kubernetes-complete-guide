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

### Create Local Client NFS

`mkdir hf_nfs_client`

### Mount the NFS on local directory

- Ubuntu: `sudo mount -o nolocks -t nfs 192.168.0.17:/mnt/nfs-server ./hf_nfs_client`
- Fedora: `sudo mount -o nolock -t nfs 192.168.0.17:/mnt/hf_nfs_share  ./hf_nfs_client`

> Change the IP to your own
