pipeline {
  agent {
    docker {
      image 'docker:git'                 // Image chứa Docker CLI và Git
      args '-v /var/run/docker.sock:/var/run/docker.sock' // Dùng Docker daemon của host
    }
  }
  triggers {
    githubPush()
  }
  environment {
    APP_NAME = "roommatch-fe"
    NAMESPACE = "room-match"
    IMAGE = "ghcr.io/hoangw2k4/roommatch_fe:uat"
    K8S_REPO = "https://github.com/HoangW2k4/k8s-fizahub.git"
    K8S_BRANCH = "main"
  }
  stages {
    stage("Checkout") {
      when { branch "devops" }
      steps {
        checkout scm
      }
    }

    stage("Build Image") {
      steps {
        sh "docker build -t ${IMAGE} ."
      }
    }

    stage("Push Image") {
      steps {
        withCredentials([string(credentialsId: "test_github", variable: "GHCR_TOKEN")]) {
          sh '''
            echo $GHCR_TOKEN | docker login ghcr.io -u HoangW2k4 --password-stdin
            docker push ${IMAGE}
          '''
        }
      }
    }

    stage("Deploy to K8s") {
      steps {
        withKubeConfig([credentialsId: "kubeconfig-file"]) {
          withCredentials([string(credentialsId: "test_github", variable: "GITHUB_TOKEN")]) {
            sh '''
              rm -rf k8s-fizahub
              git clone https://${GITHUB_TOKEN}@github.com/HoangW2k4/k8s-fizahub.git
              cd k8s-fizahub
              git checkout ${K8S_BRANCH}

              kubectl apply -f k8s/roommatch/

              kubectl rollout restart deployment/${APP_NAME} -n ${NAMESPACE}
              kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE}
            '''
          }
        }
      }
    }
  }
}