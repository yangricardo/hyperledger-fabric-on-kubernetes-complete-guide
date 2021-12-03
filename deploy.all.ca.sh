#/bin/bash

pushd ./hf-on-k8s-course/2.ca-config
	CA_APPLIABLE_FILES=$(ls ./**/*.yaml)
	for CA_FILE in ${CA_APPLIABLE_FILES[@]}
	do
		kubectl apply -f $CA_FILE
	done
popd