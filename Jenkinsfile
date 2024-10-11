pipeline {
  agent {
    kubernetes {
      yaml """
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins-role
  restartPolicy: Never
  containers:
  - name: awscli
    image: artifactory.cloud.cms.gov/docker/amazon/aws-cli:2.15.19
    command: ['cat']
    tty: true
  - name: node
    image: node:20.18
    command: ['cat']
    tty: true
    resources:
      requests:
        memory: 8Gi
      limits:
        memory: 16Gi
  volumes:
  - name: jenkins-docker-cfg
    projected:
      sources:
      - secret:
          name: jfrog-secret
          items:
            - key: .dockerconfigjson
              path: config.json
"""
    }
  }
  // Run linter from Go on server.go
  stages {
    // Runs tests defined in server_test.go
    stage('Node build') {
      steps {
        container(node) {
           sh '''
                cd source
                npm install
                # Important: CDK global version number
                npm i
                cdk_version=$(node ../../deployment/get-cdk-version.js) # Note: grabs from node_modules/aws-cdk-lib/package.json

                echo "------------------------------------------------------------------------------"
                echo "[Install] Installing CDK $cdk_version"
                echo "------------------------------------------------------------------------------"

                npm install aws-cdk@$cdk_version

                node_modules/aws-cdk/bin/cdk synth --quiet --asset-metdata false --path-metadata false

                if [ $? -ne 0 ]; then
                  echo "******************************************************************************"
                  echo "cdk-nag found errors"
                  echo "******************************************************************************"
                  exit 1
                fi
              '''
        }
      }
    }
//     // Assumes the service account role in specified AWS accoujnt
//     stage(‘AWS Config’) {
//       steps {
//         container(‘awscli’) {
//           sh ‘’'
//           aws sts assume-role \
//             --role-arn arn:aws:iam::280350076387:role/delegatedadmin/developer/jenkins-role \
//             --role-session-name session \
//             > /tmp/role-creds.json
//           cat > .aws-creds <<EOF
// [default]
// aws_access_key_id = $(grep -o ‘“AccessKeyId”: “[^“]*“’ /tmp/role-creds.json | awk -F’“' ‘{print $4}‘)
// aws_secret_access_key = $(grep -o ‘“SecretAccessKey”: “[^“]*“’ /tmp/role-creds.json | awk -F’“' ‘{print $4}‘)
// aws_session_token = $(grep -o ‘“SessionToken”: “[^“]*“’ /tmp/role-creds.json | awk -F’“' ‘{print $4}‘)
// EOF
//           ‘’'
//         }
//       }
//     }
  }
}