aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 056680897227.dkr.ecr.us-east-1.amazonaws.com
docker build -t dndhelper-apiplatform-imagerepositorybbcbc9df-sgwtpovdwzhb .
docker tag dndhelper-apiplatform-imagerepositorybbcbc9df-sgwtpovdwzhb:latest 056680897227.dkr.ecr.us-east-1.amazonaws.com/dndhelper-apiplatform-imagerepositorybbcbc9df-sgwtpovdwzhb:latest
docker push 056680897227.dkr.ecr.us-east-1.amazonaws.com/dndhelper-apiplatform-imagerepositorybbcbc9df-sgwtpovdwzhb:latest