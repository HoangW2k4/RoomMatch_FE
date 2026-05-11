pipeline {
  agent any
  triggers {
    githubPush()
  }
  environment {
    APP_NAME = "roommatch-fe"
    NAMESPACE = "room-match"
    IMAGE = "ghcr.io/hoangw2k4/roommatch_fe:uat"
    K8S_REPO = "https://github.com/HoangW2k4/k8s-fizahub.git"
    K8S_BRANCH = "main"
    TARGET_BRANCH = "devops"
  }
  stages {
    stage("Checkout") {
      steps {
        git branch: "${TARGET_BRANCH}",
            credentialsId: "test_github",
            url: "https://github.com/HoangW2k4/RoomMatch_FE.git"
        script {
          env.CURRENT_BRANCH = sh(
            script: "git rev-parse --abbrev-ref HEAD",
            returnStdout: true
          ).trim()
          echo "Checked out branch: ${env.CURRENT_BRANCH}"
        }
      }
    }

    stage("Build Image") {
      when {
        expression {
          return env.CURRENT_BRANCH == TARGET_BRANCH
        }
      }
      steps {
        sh "docker build -t ${IMAGE} ."
      }
    }

    stage("Push Image") {
      when {
        expression {
          return env.CURRENT_BRANCH == TARGET_BRANCH
        }
      }
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
      when {
        expression {
          return env.CURRENT_BRANCH == TARGET_BRANCH
        }
      }
      steps {
        withKubeConfig([credentialsId: "kubeconfig-file"]) {
          withCredentials([string(credentialsId: "test_github", variable: "GITHUB_TOKEN")]) {
            sh '''
              rm -rf k8s-fizahub
              git clone https://${GITHUB_TOKEN}@github.com/HoangW2k4/k8s-fizahub.git
              cd k8s-fizahub
              git checkout ${K8S_BRANCH}

              kubectl apply -f k8s/roommatch

              kubectl rollout restart deployment/${APP_NAME} -n ${NAMESPACE}
              kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE}
            '''
          }
        }
      }
    }
  }
}